import { Router, type Request } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createAdminSchema, inviteAdminSchema } from "./schema.js";
import * as service from "./service.js";

export const adminAccountsRouter = Router();

// Scoped to this router's own path prefix — an unscoped `.use()` here would
// intercept *any* request that falls through unmatched to this point in
// app.ts's router chain (e.g. a genuinely 404 path, or a route registered
// in a router mounted later), turning it into a bogus 401/403 instead.
adminAccountsRouter.use("/admin/accounts", authenticate, requireRole("ADMIN"));

function actorFrom(req: Request) {
  return { actorUserId: req.user!.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

adminAccountsRouter.get(
  "/admin/accounts",
  asyncHandler(async (_req, res) => {
    res.json(await service.listAdmins());
  })
);

adminAccountsRouter.post(
  "/admin/accounts/invite",
  validateRequest({ body: inviteAdminSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.inviteAdmin(req.body, actorFrom(req)));
  })
);

adminAccountsRouter.post(
  "/admin/accounts",
  validateRequest({ body: createAdminSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createAdminDirectly(req.body, actorFrom(req)));
  })
);

adminAccountsRouter.post(
  "/admin/accounts/:id/suspend",
  asyncHandler(async (req, res) => {
    res.json(await service.suspendAdmin(requireParam(req, "id"), actorFrom(req)));
  })
);

adminAccountsRouter.post(
  "/admin/accounts/:id/reactivate",
  asyncHandler(async (req, res) => {
    res.json(await service.reactivateAdmin(requireParam(req, "id"), actorFrom(req)));
  })
);

adminAccountsRouter.post(
  "/admin/accounts/:id/reset-credential",
  asyncHandler(async (req, res) => {
    res.json(await service.resetAdminCredential(requireParam(req, "id"), actorFrom(req)));
  })
);
