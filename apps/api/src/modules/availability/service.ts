import { prisma } from "../../lib/prisma.js";
import type { AvailabilityQuery, CreateTimeSlotInput } from "./schema.js";

// FR-027: publicly visible slots with remaining capacity, for a service +
// area (service/area matching itself is enforced at the booking-scheduling
// layer via capacity, not by tagging slots per-service — slots are a
// shared operational resource across all services at launch).
export async function getAvailability(query: AvailabilityQuery) {
  const from = query.from ?? new Date();
  const to = query.to ?? new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

  await generateMissingTimeSlots(from, to);

  const [operatingHours, closedDates] = await Promise.all([
    prisma.operatingHours.findMany(),
    prisma.closedDate.findMany({ where: { date: { gte: startOfUtcDay(from), lte: endOfUtcDay(to) } } }),
  ]);
  const hoursByWeekday = new Map(operatingHours.map((entry) => [entry.weekday, entry]));
  const closedDayKeys = new Set(closedDates.map((entry) => utcDayKey(entry.date)));

  const slots = await prisma.timeSlot.findMany({
    where: { active: true, date: { gte: startOfUtcDay(from), lte: endOfUtcDay(to) } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return slots
    .filter((slot) => {
      const hours = hoursByWeekday.get(slot.date.getUTCDay());
      return (
        slot.bookedCount < slot.capacity &&
        !!hours?.active &&
        !closedDayKeys.has(utcDayKey(slot.date)) &&
        slot.startTime >= hours.openTime &&
        slot.endTime <= hours.closeTime
      );
    })
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
  entries: {
    weekday: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
    defaultCapacity: number;
    active: boolean;
  }[]
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
  return prisma.closedDate.create({ data: { date: startOfUtcDay(date), reason } });
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

function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

async function generateMissingTimeSlots(from: Date, to: Date) {
  const rangeStart = startOfUtcDay(from);
  const rangeEnd = endOfUtcDay(to);
  const [hours, closedDates, existingSlots] = await Promise.all([
    prisma.operatingHours.findMany({ where: { active: true } }),
    prisma.closedDate.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.timeSlot.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
  ]);

  const hoursByWeekday = new Map(hours.map((entry) => [entry.weekday, entry]));
  const closedDayKeys = new Set(closedDates.map((entry) => utcDayKey(entry.date)));
  // Include inactive rows so an Admin-disabled generated slot is not recreated.
  const existingKeys = new Set(existingSlots.map((slot) => `${utcDayKey(slot.date)}|${slot.startTime}`));
  const rows: { date: Date; startTime: string; endTime: string; capacity: number }[] = [];

  for (const date = rangeStart; date <= rangeEnd; date.setUTCDate(date.getUTCDate() + 1)) {
    const dayKey = utcDayKey(date);
    const dayHours = hoursByWeekday.get(date.getUTCDay());
    if (!dayHours || closedDayKeys.has(dayKey)) continue;

    const open = timeToMinutes(dayHours.openTime);
    const close = timeToMinutes(dayHours.closeTime);
    for (let start = open; start + dayHours.slotDurationMinutes <= close; start += dayHours.slotDurationMinutes) {
      const startTime = minutesToTime(start);
      if (existingKeys.has(`${dayKey}|${startTime}`)) continue;
      rows.push({
        date: new Date(date),
        startTime,
        endTime: minutesToTime(start + dayHours.slotDurationMinutes),
        capacity: dayHours.defaultCapacity,
      });
    }
  }

  if (rows.length > 0) await prisma.timeSlot.createMany({ data: rows, skipDuplicates: true });
}
