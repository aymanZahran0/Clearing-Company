import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOTIFICATION_TEMPLATES = [
  { key: "QUOTE_READY", channel: "WHATSAPP" as const },
  { key: "BOOKING_CONFIRMED", channel: "WHATSAPP" as const },
  { key: "REMINDER", channel: "WHATSAPP" as const },
  { key: "EN_ROUTE", channel: "WHATSAPP" as const },
  { key: "COMPLETED", channel: "WHATSAPP" as const },
  { key: "FEEDBACK_REQUEST", channel: "WHATSAPP" as const },
  { key: "RESCHEDULE", channel: "WHATSAPP" as const },
  { key: "CANCELLATION", channel: "WHATSAPP" as const },
  { key: "REWORK_SCHEDULED", channel: "WHATSAPP" as const },
];

// FR-006's minimum 8-service launch catalog (spec.md), grouped into three
// categories. Pricing types deliberately cover all five research.md R7
// modes so the pricing-calculation paths all have real seed coverage.
const CATEGORIES = [
  { slug: "residential", nameAr: "التنظيف المنزلي", nameEn: "Residential Cleaning", sortOrder: 1 },
  { slug: "commercial-recurring", nameAr: "التنظيف التجاري والدوري", nameEn: "Commercial & Recurring", sortOrder: 2 },
  { slug: "specialty", nameAr: "خدمات متخصصة", nameEn: "Specialty Cleaning", sortOrder: 3 },
] as const;

const SERVICES = [
  {
    slug: "home-cleaning",
    category: "residential",
    nameAr: "تنظيف شامل للمنزل",
    pricingType: "PROPERTY_SIZE" as const,
    basePrice: 20000,
    minimumPrice: 15000,
    defaultDurationMinutes: 120,
  },
  {
    slug: "upholstery-steam-cleaning",
    category: "specialty",
    nameAr: "تنظيف المفروشات بالبخار",
    pricingType: "QUANTITY" as const,
    basePrice: 5000,
    minimumPrice: null,
    defaultDurationMinutes: 45,
  },
  {
    slug: "post-construction-cleaning",
    category: "specialty",
    nameAr: "تنظيف ما بعد البناء",
    pricingType: "CUSTOM_QUOTE" as const,
    basePrice: null,
    minimumPrice: null,
    defaultDurationMinutes: 240,
  },
  {
    slug: "kitchen-bathroom-deep-clean",
    category: "residential",
    nameAr: "تنظيف عميق للمطبخ والحمام",
    pricingType: "FIXED" as const,
    basePrice: 15000,
    minimumPrice: null,
    defaultDurationMinutes: 90,
  },
  {
    slug: "surface-disinfection",
    category: "specialty",
    nameAr: "تعقيم الأسطح",
    pricingType: "PROPERTY_SIZE" as const,
    basePrice: 10000,
    minimumPrice: 8000,
    defaultDurationMinutes: 60,
  },
  {
    slug: "water-tank-cleaning",
    category: "specialty",
    nameAr: "تنظيف خزانات المياه",
    pricingType: "FIXED" as const,
    basePrice: 25000,
    minimumPrice: null,
    defaultDurationMinutes: 90,
  },
  {
    slug: "ac-filter-cleaning",
    category: "specialty",
    nameAr: "تنظيف فلاتر ووحدات التكييف",
    pricingType: "QUANTITY" as const,
    basePrice: 4000,
    minimumPrice: null,
    defaultDurationMinutes: 30,
  },
  {
    slug: "office-recurring-cleaning",
    category: "commercial-recurring",
    nameAr: "تنظيف دوري للمكاتب والشقق المفروشة",
    pricingType: "HOURLY" as const,
    basePrice: 6000,
    minimumPrice: null,
    defaultDurationMinutes: 60,
  },
];

const CHECKLIST_ITEMS = [
  { labelAr: "تم تنظيف جميع الأسطح", labelEn: "All surfaces wiped down", type: "YES_NO" as const, required: true },
  { labelAr: "تم كنس/شفط جميع الأرضيات", labelEn: "All floors swept/vacuumed", type: "YES_NO" as const, required: true },
  { labelAr: "ملاحظات إضافية", labelEn: "Additional notes", type: "TEXT" as const, required: false },
  { labelAr: "مدة التنفيذ الفعلية (دقائق)", labelEn: "Actual duration (minutes)", type: "NUMBER" as const, required: false },
  { labelAr: "توقيع العميل عند الاستلام", labelEn: "Customer sign-off", type: "SIGNATURE" as const, required: true },
  { labelAr: "تعليم أي مشكلة لاحظها الفني", labelEn: "Flag any issue noticed", type: "ISSUE_FLAG" as const, required: false },
];

function timeSlotRows(days: number, startDate: Date) {
  const rows: { date: Date; startTime: string; endTime: string; capacity: number }[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + d);
    const weekday = date.getUTCDay();
    if (weekday === 5) continue; // Friday closed, matches OPERATING_HOURS below

    for (const startTime of ["09:00", "11:00", "13:00", "15:00"]) {
      const [h, m] = startTime.split(":").map(Number);
      const endHour = h + 2;
      rows.push({
        date,
        startTime,
        endTime: `${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        capacity: 3,
      });
    }
  }
  return rows;
}

async function main() {
  // Never seed production with a shared/default Admin password — this
  // seed is for local/staging environments only (quickstart.md).
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nuqaa-asir.local" },
    update: {},
    create: {
      fullName: "Admin",
      email: "admin@nuqaa-asir.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  for (const template of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        key: template.key,
        channel: template.channel,
        bodyAr: `[نص عربي بديل لـ ${template.key}]`,
        bodyEn: `[Placeholder English body for ${template.key}]`,
      },
    });
  }

  const defaultSettings = [
    { key: "default_locale", value: "ar-SA" },
    { key: "tax_rate", value: 0.15 },
    { key: "booking_horizon_weeks", value: 8 },
  ];
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
  }

  // T180: both launch service areas (spec.md — "serving Abha and Khamis Mushait").
  // IDs are left to Prisma's default UUID generator (not a fixed literal
  // like "seed-area-abha") — the addresses/quotes API schemas validate
  // serviceAreaId as a UUID (packages/shared's `uuidSchema`), so a
  // non-UUID seeded id would 422 on every real customer request that
  // references it. Upserted by `nameEn` instead of `id` to stay idempotent
  // across repeated seed runs.
  async function upsertServiceArea(data: {
    nameAr: string;
    nameEn: string;
    city: string;
    travelFee: number;
    active: boolean;
  }) {
    const existing = await prisma.serviceArea.findFirst({ where: { nameEn: data.nameEn } });
    if (existing) return existing;
    return prisma.serviceArea.create({ data });
  }

  const [abha, khamisMushait] = await Promise.all([
    upsertServiceArea({ nameAr: "أبها", nameEn: "Abha", city: "Abha", travelFee: 0, active: true }),
    upsertServiceArea({
      nameAr: "خميس مشيط",
      nameEn: "Khamis Mushait",
      city: "Khamis Mushait",
      travelFee: 1500,
      active: true,
    }),
  ]);

  const categoryIds = new Map<string, string>();
  for (const category of CATEGORIES) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
    });
    categoryIds.set(category.slug, created.id);
  }

  const serviceIds = new Map<string, string>();
  for (const svc of SERVICES) {
    const created = await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        categoryId: categoryIds.get(svc.category)!,
        slug: svc.slug,
        nameAr: svc.nameAr,
        pricingType: svc.pricingType,
        basePrice: svc.basePrice,
        minimumPrice: svc.minimumPrice,
        defaultDurationMinutes: svc.defaultDurationMinutes,
        requiresManualQuote: svc.pricingType === "CUSTOM_QUOTE",
      },
    });
    serviceIds.set(svc.slug, created.id);

    // Checklist template (one version per service).
    const existingTemplate = await prisma.checklistTemplate.findFirst({
      where: { serviceId: created.id, active: true },
    });
    if (!existingTemplate) {
      await prisma.checklistTemplate.create({
        data: {
          serviceId: created.id,
          version: 1,
          items: {
            create: CHECKLIST_ITEMS.map((item, index) => ({ ...item, sortOrder: index + 1 })),
          },
        },
      });
    }
  }

  // Sample add-ons on the flagship home-cleaning service.
  const homeCleaningId = serviceIds.get("home-cleaning")!;
  const existingAddOns = await prisma.serviceAddOn.count({ where: { serviceId: homeCleaningId } });
  if (existingAddOns === 0) {
    await prisma.serviceAddOn.createMany({
      data: [
        {
          serviceId: homeCleaningId,
          nameAr: "تنظيف داخل الخزائن",
          nameEn: "Inside-Cabinet Cleaning",
          pricingMode: "FIXED",
          unitPrice: 3000,
          durationImpactMinutes: 20,
        },
        {
          serviceId: homeCleaningId,
          nameAr: "تنظيف النوافذ (لكل نافذة)",
          nameEn: "Window Cleaning (per window)",
          pricingMode: "PER_QUANTITY",
          unitPrice: 1000,
          durationImpactMinutes: 5,
        },
      ],
    });
  }

  // Operating hours: Sunday-Thursday + Saturday, Friday closed.
  const existingHours = await prisma.operatingHours.count();
  if (existingHours === 0) {
    await prisma.operatingHours.createMany({
      data: [0, 1, 2, 3, 4, 6].map((weekday) => ({
        weekday,
        openTime: "09:00",
        closeTime: "18:00",
        active: true,
      })),
    });
  }

  // ~2 weeks of TimeSlot rows starting today.
  const existingSlots = await prisma.timeSlot.count();
  if (existingSlots === 0) {
    const rows = timeSlotRows(14, new Date());
    for (const row of rows) {
      await prisma.timeSlot.upsert({
        where: { date_startTime: { date: row.date, startTime: row.startTime } },
        update: {},
        create: row,
      });
    }
  }

  // Sample customer + address for the "sample bookings across every
  // status" requirement below.
  let customer = await prisma.user.findUnique({ where: { email: "customer@example.com" } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        fullName: "Sara Al-Qahtani",
        email: "customer@example.com",
        phoneNormalized: "+966501112233",
        passwordHash: await bcrypt.hash("ChangeMe123!", 12),
        role: "CUSTOMER",
        status: "ACTIVE",
        customerProfile: { create: { preferredChannel: "WHATSAPP", customerType: "INDIVIDUAL" } },
      },
    });
  }

  let address = await prisma.customerAddress.findFirst({ where: { customerId: customer.id } });
  if (!address) {
    address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: "Home",
        city: "Abha",
        neighborhood: "Al Numan",
        serviceAreaId: abha.id,
        isDefault: true,
      },
    });
    // Second address in the other launch service area, so both areas have
    // seeded coverage rather than only Abha.
    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: "Office",
        city: "Khamis Mushait",
        neighborhood: "Al Nasim",
        serviceAreaId: khamisMushait.id,
        isDefault: false,
      },
    });
  }

  // Sample bookings across every BookingStatus value (research.md R5's
  // 9-value enum), so seeded data exercises every downstream screen
  // (Admin list filters, dashboard overdue/unscheduled counts, quality
  // queue) without needing to manually walk a booking through its
  // lifecycle first.
  const sampleStatuses = [
    "DRAFT",
    "PENDING",
    "CONFIRMED",
    "RESCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
    "COMPLAINT_OPENED",
  ] as const;

  for (const status of sampleStatuses) {
    const referenceNumber = `SEED-${status}`;
    const existingBooking = await prisma.booking.findUnique({ where: { referenceNumber } });
    if (existingBooking) continue;

    const unpricedStatuses: readonly string[] = ["DRAFT", "PENDING", "REJECTED"];
    const hasPrice = !unpricedStatuses.includes(status);
    const booking = await prisma.booking.create({
      data: {
        referenceNumber,
        verificationToken: `seed-token-${status.toLowerCase()}`,
        customerId: customer.id,
        addressId: address.id,
        source: "WEB",
        status,
        propertyType: "APARTMENT",
        propertyDetailsJson: { rooms: 3, areaSqm: 120 },
        preferredDate: new Date(),
        scheduledStartAt: status === "CONFIRMED" || status === "IN_PROGRESS" || status === "COMPLETED" ? new Date() : null,
        scheduledEndAt: status === "CONFIRMED" || status === "IN_PROGRESS" || status === "COMPLETED" ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null,
        arrivedAt: status === "IN_PROGRESS" || status === "COMPLETED" ? new Date() : null,
        startedAt: status === "IN_PROGRESS" || status === "COMPLETED" ? new Date() : null,
        completedAt: status === "COMPLETED" || status === "COMPLAINT_OPENED" ? new Date() : null,
        cancellationReason: status === "CANCELLED" ? "Customer requested cancellation" : null,
        cancelledByRole: status === "CANCELLED" ? "CUSTOMER" : null,
        rejectionReason: status === "REJECTED" ? "Outside current service capacity" : null,
        subtotalSnapshot: hasPrice ? 20000 : null,
        taxSnapshot: hasPrice ? 3000 : 0,
        totalSnapshot: hasPrice ? 23000 : null,
        createdByUserId: admin.id,
        items: {
          create: [
            {
              serviceId: homeCleaningId,
              descriptionSnapshot: "Comprehensive Home Cleaning",
              quantity: 1,
              unitPriceSnapshot: 20000,
              totalSnapshot: 20000,
              durationMinutesSnapshot: 120,
            },
          ],
        },
      },
    });

    await prisma.bookingStatusHistory.create({
      data: { bookingId: booking.id, fromStatus: null, toStatus: status, reason: "Seeded sample booking" },
    });

  }

  // US1/US5: sample public-site content so a fresh environment's Home page
  // and /faq are browsable immediately, not empty stubs.
  const CONTENT_BLOCKS = [
    {
      key: "home-hero",
      type: "SECTION" as const,
      titleAr: "خدمات تنظيف احترافية في عسير",
      titleEn: "Professional Cleaning Services in Asir",
      bodyAr: "نقدم خدمات تنظيف منزلية وتجارية موثوقة في أبها وخميس مشيط.",
      bodyEn: "Reliable residential and commercial cleaning across Abha and Khamis Mushait.",
      sortOrder: 1,
    },
    {
      key: "home-why-us",
      type: "SECTION" as const,
      titleAr: "لماذا تختارنا",
      titleEn: "Why Choose Us",
      bodyAr: "فريق مدرب، ضمان الجودة، وحجز سهل عبر الإنترنت أو الهاتف.",
      bodyEn: "Trained staff, quality guarantees, and easy booking online or by phone.",
      sortOrder: 2,
    },
  ];
  for (const block of CONTENT_BLOCKS) {
    await prisma.websiteContentBlock.upsert({
      where: { key: block.key },
      update: {},
      create: block,
    });
  }

  const FAQ_ITEMS = [
    {
      questionAr: "ما هي مناطق تغطية الخدمة؟",
      questionEn: "Which areas do you serve?",
      answerAr: "نخدم حالياً مدينتي أبها وخميس مشيط.",
      answerEn: "We currently serve Abha and Khamis Mushait.",
      sortOrder: 1,
    },
    {
      questionAr: "كيف يمكنني إلغاء أو إعادة جدولة حجزي؟",
      questionEn: "How do I cancel or reschedule my booking?",
      answerAr: "يمكنك ذلك من صفحة تفاصيل الحجز في حسابك، أو بالتواصل معنا عبر واتساب.",
      answerEn: "You can do this from your booking detail page, or by contacting us on WhatsApp.",
      sortOrder: 2,
    },
    {
      questionAr: "ما هي طرق الدفع المتاحة؟",
      questionEn: "What payment methods are available?",
      answerAr: "نقبل الدفع النقدي والتحويل البنكي عند اكتمال الخدمة.",
      answerEn: "We accept cash and bank transfer upon service completion.",
      sortOrder: 3,
    },
  ];
  for (const item of FAQ_ITEMS) {
    const existing = await prisma.faqItem.findFirst({ where: { questionEn: item.questionEn } });
    if (!existing) {
      await prisma.faqItem.create({ data: item });
    }
  }

  // WhatsApp reuses the number already wired into the click-to-chat CTA
  // (apps/web/src/lib/whatsapp.ts) so the two stay in sync by default.
  await prisma.socialMediaLink.upsert({
    where: { platform: "WHATSAPP" },
    update: {},
    create: { platform: "WHATSAPP", url: "https://wa.me/966502266402", active: true },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
