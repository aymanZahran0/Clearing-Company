import { Router } from "express";
import type { Request } from "express";
import { ApiError } from "@nuqaa-asir/shared";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { paymentInputSchema } from "./schema.js";
import * as service from "./service.js";

export const paymentsRouter = Router();

async function assertOwnerOrAdmin(req: Request, bookingId: string) {
  if (req.user!.role === "ADMIN") return;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== req.user!.id) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
}

paymentsRouter.get(
  "/bookings/:id/payments",
  authenticate,
  asyncHandler(async (req, res) => {
    const bookingId = requireParam(req, "id");
    await assertOwnerOrAdmin(req, bookingId);
    res.json(await service.listPaymentsForBooking(bookingId));
  })
);

paymentsRouter.post(
  "/bookings/:id/payments",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: paymentInputSchema }),
  asyncHandler(async (req, res) => {
    const payment = await service.recordPayment(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json(payment);
  })
);

paymentsRouter.get(
  "/invoices/mine",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    res.json(await service.listOwnInvoices(req.user!.id));
  })
);

paymentsRouter.get(
  "/bookings/:id/invoice",
  authenticate,
  asyncHandler(async (req, res) => {
    const bookingId = requireParam(req, "id");
    await assertOwnerOrAdmin(req, bookingId);
    res.json(await service.getOrCreateInvoice(bookingId));
  })
);
