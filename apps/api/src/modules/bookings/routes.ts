import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { strictRateLimit } from "../../middleware/rateLimit.js";
import { moneySchema } from "@nuqaa-asir/shared";
import { ApiError } from "@nuqaa-asir/shared";
import {
  adminBookingCreateSchema,
  bookingCreateSchema,
  bookingReferenceLookupQuerySchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
  scheduleBookingSchema,
} from "./schema.js";
import * as service from "./service.js";

const confirmBookingSchema = z.object({
  priceOverride: moneySchema.optional(),
  priceOverrideReason: z.string().trim().min(1).max(500).optional(),
});

const rejectBookingSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const bookingsRouter = Router();

bookingsRouter.post(
  "/bookings",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: bookingCreateSchema }),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) {
      throw new ApiError(422, "VALIDATION_ERROR", "Idempotency-Key header is required");
    }
    const booking = await service.createBooking(req.body, req.user!.id, {
      source: "WEB",
      idempotencyKey,
    });
    res.status(201).json(booking);
  })
);

bookingsRouter.get(
  "/bookings/reference/:referenceNumber",
  strictRateLimit,
  validateRequest({ query: bookingReferenceLookupQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.getBookingByReference(requireParam(req, "referenceNumber")));
  })
);

bookingsRouter.get(
  "/bookings",
  authenticate,
  validateRequest({ query: listBookingsQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as {
      status?: string;
      from?: Date;
      to?: Date;
      scheduledFrom?: Date;
      scheduledTo?: Date;
      needsScheduling?: boolean;
      customerId?: string;
      page: number;
      pageSize: number;
    };

    if (req.user!.role === "CUSTOMER") {
      res.json(await service.listOwnBookings(req.user!.id, filters));
      return;
    }
    res.json(await service.listAllBookings(filters));
  })
);

bookingsRouter.get(
  "/bookings/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await service.getBookingById(requireParam(req, "id"), req.user!));
  })
);

bookingsRouter.post(
  "/bookings/admin",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: adminBookingCreateSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.createBooking(req.body, undefined, {
      source: "ADMIN_PHONE",
      createdByUserId: req.user!.id,
      idempotencyKey: req.header("Idempotency-Key") ?? undefined,
    });
    res.status(201).json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/confirm",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: confirmBookingSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.confirmBooking(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/reject",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: rejectBookingSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.rejectBooking(requireParam(req, "id"), req.body.reason, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.get(
  "/bookings/:id/history",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getBookingHistory(requireParam(req, "id")));
  })
);

bookingsRouter.post(
  "/bookings/:id/schedule",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: scheduleBookingSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.scheduleBooking(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/reschedule",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: scheduleBookingSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.rescheduleBooking(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

// FR-040: no-fee cancellation, available to the owning Customer or Admin.
bookingsRouter.post(
  "/bookings/:id/cancel",
  authenticate,
  validateRequest({ body: cancelBookingSchema }),
  asyncHandler(async (req, res) => {
    const bookingId = requireParam(req, "id");
    if (req.user!.role === "CUSTOMER") {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.customerId !== req.user!.id) {
        throw new ApiError(404, "NOT_FOUND", "Booking not found");
      }
    }
    const booking = await service.cancelBooking(
      bookingId,
      req.body.reason,
      req.user!.role as "CUSTOMER" | "ADMIN",
      { actorUserId: req.user!.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/en-route",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const booking = await service.markEnRoute(requireParam(req, "id"), {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/arrive",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const booking = await service.markArrived(requireParam(req, "id"), {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/start",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const booking = await service.startExecution(requireParam(req, "id"), {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/complete",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const booking = await service.completeBooking(requireParam(req, "id"), {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(booking);
  })
);

// US6 review/complaint/rework endpoints are added in Phase 8 (T135-T136),
// extending this router rather than replacing it.
