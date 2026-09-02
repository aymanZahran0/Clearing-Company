import { Router, type Request } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  adminUpdateCustomerSchema,
  createCustomerSchema,
  listCustomersQuerySchema,
  reactivateCustomerSchema,
  suspendCustomerSchema,
  updateOwnProfileSchema,
} from "./schema.js";
import * as service from "./service.js";

function actorFrom(req: Request) {
  return { actorUserId: req.user!.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

export const customersRouter = Router();

// FR-016/FR-018: explicit Admin customer creation for the phone/WhatsApp
// channel, used before an address can be attached (customer must exist
// first — see addresses/routes.ts POST /customers/:customerId/addresses).
customersRouter.post(
  "/customers",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createCustomerSchema }),
  asyncHandler(async (req, res) => {
    const user = await service.createInvitedCustomer(req.body);
    res.status(201).json(await service.getCustomerSummaryById(user.id));
  })
);

customersRouter.get(
  "/customers/me",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    res.json(await service.getOwnProfile(req.user!.id));
  })
);

customersRouter.patch(
  "/customers/me",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: updateOwnProfileSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateOwnProfile(req.user!.id, req.body));
  })
);

customersRouter.get(
  "/customers",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listCustomersQuerySchema }),
  asyncHandler(async (req, res) => {
    const { search, status, page, pageSize } = req.query as unknown as {
      search?: string;
      status?: "ACTIVE" | "INVITED" | "SUSPENDED";
      page: number;
      pageSize: number;
    };
    res.json(await service.searchCustomers(search, page, pageSize, status));
  })
);

customersRouter.get(
  "/customers/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getCustomerSummaryById(requireParam(req, "id")));
  })
);

customersRouter.patch(
  "/customers/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: adminUpdateCustomerSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateCustomerAsAdmin(requireParam(req, "id"), req.body));
  })
);

customersRouter.delete(
  "/customers/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteCustomer(requireParam(req, "id"), actorFrom(req));
    res.status(204).send();
  })
);

// FR-013/FR-014/FR-017a: status lifecycle, distinct from the Admin-account
// lifecycle module (US5 scenario 13) and unreachable by Customer tokens
// (requireRole("ADMIN") — US5 scenario 11).
customersRouter.post(
  "/customers/:id/suspend",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: suspendCustomerSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.suspendCustomer(requireParam(req, "id"), req.body, actorFrom(req)));
  })
);

customersRouter.post(
  "/customers/:id/reactivate",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: reactivateCustomerSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.reactivateCustomer(requireParam(req, "id"), req.body, actorFrom(req)));
  })
);
