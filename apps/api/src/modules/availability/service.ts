import { prisma } from "../../lib/prisma.js";
import type { AvailabilityQuery, CreateTimeSlotInput } from "./schema.js";

// FR-027: publicly visible slots with remaining capacity, for a service +
// area (service/area matching itself is enforced at the booking-scheduling
// layer via capacity, not by tagging slots per-service — slots are a
// shared operational resource across all services at launch).
export async function getAvailability(query: AvailabilityQuery) {
  const from = query.from ?? new Date();
  const to = query.to ?? new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

  const slots = await prisma.timeSlot.findMany({
    where: { active: true, date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return slots
    .filter((slot) => slot.bookedCount < slot.capacity)
    .map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      remaining: slot.capacity - slot.bookedCount,
    }));
}

export function listOperatingHours() {
  return prisma.operatingHours.findMany({ orderBy: { weekday: "asc" } });
}

export async function replaceOperatingHours(
  entries: { weekday: number; openTime: string; closeTime: string; active: boolean }[]
) {
  await prisma.$transaction([
    prisma.operatingHours.deleteMany({}),
    prisma.operatingHours.createMany({ data: entries }),
  ]);
  return listOperatingHours();
}

export function listClosedDates() {
  return prisma.closedDate.findMany({ orderBy: { date: "asc" } });
}

export function createClosedDate(date: Date, reason?: string) {
  return prisma.closedDate.create({ data: { date, reason } });
}

export function listTimeSlots() {
  return prisma.timeSlot.findMany({ orderBy: [{ date: "asc" }, { startTime: "asc" }] });
}

export function createTimeSlot(input: CreateTimeSlotInput) {
  return prisma.timeSlot.create({ data: input });
}

export function updateTimeSlot(id: string, data: { capacity?: number; active?: boolean }) {
  return prisma.timeSlot.update({ where: { id }, data });
}
