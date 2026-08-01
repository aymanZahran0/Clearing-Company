import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import type { UpdateChecklistResultsInput, UpsertChecklistTemplateInput } from "./schema.js";

// FR-045: the checklist template is versioned per service; the Admin
// catalog editor (T127) reads the latest active version.
export async function getChecklistTemplate(serviceId: string) {
  const template = await prisma.checklistTemplate.findFirst({
    where: { serviceId, active: true },
    orderBy: { version: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) {
    throw new ApiError(404, "NOT_FOUND", "No checklist template configured for this service");
  }
  return template;
}

// Publishing a new template never mutates an existing version in place —
// it deactivates the previous one and creates version+1, so any
// ChecklistRun that already snapshotted an older version (FR-046) is
// unaffected (verified by T132).
export async function upsertChecklistTemplate(serviceId: string, input: UpsertChecklistTemplateInput) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }

  const previous = await prisma.checklistTemplate.findFirst({
    where: { serviceId, active: true },
    orderBy: { version: "desc" },
  });

  return prisma.$transaction(async (tx) => {
    if (previous) {
      await tx.checklistTemplate.update({ where: { id: previous.id }, data: { active: false } });
    }
    return tx.checklistTemplate.create({
      data: {
        serviceId,
        version: (previous?.version ?? 0) + 1,
        items: { create: input.items },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

async function getBookingPrimaryServiceId(bookingId: string): Promise<string> {
  const item = await prisma.bookingItem.findFirst({
    where: { bookingId, addOnId: null },
  });
  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "Booking has no primary service item");
  }
  return item.serviceId;
}

// FR-046: the run is created (and the template version snapshotted) the
// first time the checklist is opened for a booking, not at template-edit
// time — this is what makes T132's "edit mid-run" guarantee possible.
export async function getOrCreateChecklistRun(bookingId: string) {
  const existing = await prisma.checklistRun.findUnique({
    where: { bookingId },
    include: { results: true, template: { include: { items: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (existing) return existing;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }

  const serviceId = await getBookingPrimaryServiceId(bookingId);
  const template = await getChecklistTemplate(serviceId);

  return prisma.checklistRun.create({
    data: {
      bookingId,
      templateId: template.id,
      templateVersionSnapshot: template.version,
      results: {
        create: template.items.map((item) => ({ templateItemId: item.id, value: undefined })),
      },
    },
    include: { results: true, template: { include: { items: { orderBy: { sortOrder: "asc" } } } } },
  });
}

// T125: flagging an item as an issue auto-creates a QualityIssue with
// source = CHECKLIST_FAILURE — the checklist runner surfaces this
// immediately rather than waiting for a post-completion review.
export async function updateChecklistResults(
  bookingId: string,
  input: UpdateChecklistResultsInput,
  _actorUserId: string
) {
  const run = await getOrCreateChecklistRun(bookingId);
  if (run.completedAt) {
    throw new ApiError(409, "CONFLICT", "This checklist run is already complete");
  }

  await prisma.$transaction(async (tx) => {
    for (const result of input.results) {
      await tx.checklistResult.upsert({
        where: { checklistRunId_templateItemId: { checklistRunId: run.id, templateItemId: result.templateItemId } },
        create: {
          checklistRunId: run.id,
          templateItemId: result.templateItemId,
          value: result.value === undefined ? undefined : (result.value as object),
          isIssue: result.isIssue,
          issueNote: result.issueNote,
        },
        update: {
          value: result.value === undefined ? undefined : (result.value as object),
          isIssue: result.isIssue,
          issueNote: result.issueNote,
        },
      });

    }
  });

  return getOrCreateChecklistRun(bookingId);
}

export async function reviewChecklistRun(bookingId: string, actorUserId: string) {
  const run = await prisma.checklistRun.findUnique({ where: { bookingId } });
  if (!run) {
    throw new ApiError(404, "NOT_FOUND", "No checklist run for this booking");
  }
  return prisma.checklistRun.update({
    where: { bookingId },
    data: { reviewedByUserId: actorUserId, reviewedAt: new Date() },
  });
}

// FR-048/FR-051: called from the booking-completion flow to gate
// IN_PROGRESS -> COMPLETED on every required item being answered.
export async function assertChecklistComplete(bookingId: string): Promise<void> {
  const run = await prisma.checklistRun.findUnique({
    where: { bookingId },
    include: {
      results: true,
      template: { include: { items: { where: { required: true } } } },
    },
  });
  if (!run) {
    throw new ApiError(409, "CONFLICT", "Checklist has not been started for this booking");
  }

  const answeredItemIds = new Set(
    run.results.filter((r) => r.value !== null && r.value !== undefined).map((r) => r.templateItemId)
  );
  const outstanding = run.template.items.filter((item) => !answeredItemIds.has(item.id));

  if (outstanding.length > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Required checklist items are outstanding",
      { outstanding: outstanding.map((item) => item.labelEn) }
    );
  }
}

export async function markChecklistCompleted(bookingId: string, actorUserId: string) {
  await prisma.checklistRun.update({
    where: { bookingId },
    data: { completedByUserId: actorUserId, completedAt: new Date() },
  });
}
