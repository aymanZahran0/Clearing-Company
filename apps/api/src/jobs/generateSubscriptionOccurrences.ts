import { prisma } from "../lib/prisma.js";
import { generateBookingReference, generateVerificationToken } from "../lib/bookingReference.js";

const HORIZON_WEEKS = 8;

// CUSTOM subscriptions have no fixed cadence to auto-generate from — they
// are populated one occurrence at a time via the Admin occurrence editor
// instead (data-model.md §20 lists CUSTOM as a frequency value without
// defining an interval).
function nextOccurrenceDate(current: Date, frequency: string): Date | null {
  const next = new Date(current);
  switch (frequency) {
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    case "BIWEEKLY":
      next.setUTCDate(next.getUTCDate() + 14);
      return next;
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    default:
      return null;
  }
}

// FR-056: generates `Booking` rows up to an 8-week rolling horizon.
// Idempotent under retries via two layers: (1) an existence check against
// the `(subscriptionId, occurrenceDate)` unique constraint before creating,
// and (2) the constraint itself as a backstop against a concurrent run
// racing between the check and the create.
export async function generateSubscriptionOccurrences(now: Date = new Date()) {
  const horizon = new Date(now.getTime() + HORIZON_WEEKS * 7 * 24 * 60 * 60 * 1000);
  const subscriptions = await prisma.subscription.findMany({ where: { status: "ACTIVE" } });

  let created = 0;

  for (const subscription of subscriptions) {
    if (subscription.frequency === "CUSTOM") continue;

    let occurrenceDate: Date | null = subscription.lastGeneratedAt
      ? nextOccurrenceDate(subscription.lastGeneratedAt, subscription.frequency)
      : subscription.startsAt;

    while (occurrenceDate && occurrenceDate <= horizon) {
      if (subscription.endsAt && occurrenceDate > subscription.endsAt) break;

      const existing = await prisma.booking.findUnique({
        where: {
          subscriptionId_occurrenceDate: { subscriptionId: subscription.id, occurrenceDate },
        },
      });

      if (!existing) {
        const config = subscription.serviceConfigurationJson as { serviceId: string };
        await prisma.booking
          .create({
            data: {
              referenceNumber: generateBookingReference(),
              verificationToken: generateVerificationToken(),
              customerId: subscription.customerId,
              addressId: subscription.addressId,
              source: "ADMIN_PHONE",
              status: "PENDING",
              // Subscriptions don't carry a propertyType in data-model.md
              // §20; OTHER is the honest default rather than guessing.
              propertyType: "OTHER",
              propertyDetailsJson: {},
              preferredDate: occurrenceDate,
              subscriptionId: subscription.id,
              occurrenceDate,
              subtotalSnapshot: subscription.priceSnapshot,
              discountSnapshot: 0,
              travelFeeSnapshot: 0,
              taxSnapshot: 0,
              totalSnapshot: subscription.priceSnapshot,
              items: {
                create: [
                  {
                    serviceId: config.serviceId,
                    descriptionSnapshot: "Subscription occurrence",
                    quantity: 1,
                    unitPriceSnapshot: subscription.priceSnapshot,
                    totalSnapshot: subscription.priceSnapshot,
                    durationMinutesSnapshot: 60,
                  },
                ],
              },
            },
          })
          .then(() => {
            created += 1;
          })
          .catch((err: unknown) => {
            // P2002 = unique constraint violation — another run already
            // created this occurrence; safe to ignore under FR-056's
            // idempotency requirement.
            if ((err as { code?: string }).code !== "P2002") throw err;
          });
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { lastGeneratedAt: occurrenceDate },
      });

      occurrenceDate = nextOccurrenceDate(occurrenceDate, subscription.frequency);
    }
  }

  return { created };
}
