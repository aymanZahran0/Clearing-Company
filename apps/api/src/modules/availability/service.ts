import { prisma } from "../../lib/prisma.js";
import type { AvailabilityQuery } from "./schema.js";

const BOOKING_HORIZON_DAYS = 90;
const SLOT_DURATION_MINUTES = 60;
const UNLIMITED_CAPACITY = 1_000_000;

// FR-027: publicly visible slots with remaining capacity, for a service +
// area (service/area matching itself is enforced at the booking-scheduling
// layer via capacity, not by tagging slots per-service — slots are a
// shared operational resource across all services at launch).
export async function getAvailability(query: AvailabilityQuery) {
  const from = query.from ?? new Date();
  const to = query.to ?? new Date(from.getTime() + BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000);

  await ensureAlwaysOpenSlots(from, to);

  const slots = await prisma.timeSlot.findMany({
    where: { date: { gte: startOfUtcDay(from), lte: endOfUtcDay(to) } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      remaining: slot.capacity - slot.bookedCount,
    }));
}

export async function listTimeSlots() {
  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000);
  await ensureAlwaysOpenSlots(from, to);
  return prisma.timeSlot.findMany({
    where: { date: { gte: startOfUtcDay(from), lte: endOfUtcDay(to) } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const result = startOfUtcDay(date);
  result.setUTCDate(result.getUTCDate() + 1);
  result.setUTCMilliseconds(-1);
  return result;
}

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

async function ensureAlwaysOpenSlots(from: Date, to: Date) {
  const rangeStart = startOfUtcDay(from);
  const rangeEnd = endOfUtcDay(to);
  const existingSlots = await prisma.timeSlot.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
  });
  const existingKeys = new Set(existingSlots.map((slot) => `${utcDayKey(slot.date)}|${slot.startTime}`));
  const rows: { date: Date; startTime: string; endTime: string; capacity: number }[] = [];

  for (const date = rangeStart; date <= rangeEnd; date.setUTCDate(date.getUTCDate() + 1)) {
    const dayKey = utcDayKey(date);
    for (let start = 0; start < 24 * 60; start += SLOT_DURATION_MINUTES) {
      const startTime = minutesToTime(start);
      if (existingKeys.has(`${dayKey}|${startTime}`)) continue;
      rows.push({
        date: new Date(date),
        startTime,
        endTime: minutesToTime(start + SLOT_DURATION_MINUTES),
        capacity: UNLIMITED_CAPACITY,
      });
    }
  }

  await prisma.$transaction([
    prisma.timeSlot.updateMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      data: { active: true, capacity: UNLIMITED_CAPACITY },
    }),
    ...(rows.length > 0 ? [prisma.timeSlot.createMany({ data: rows, skipDuplicates: true })] : []),
  ]);
}
