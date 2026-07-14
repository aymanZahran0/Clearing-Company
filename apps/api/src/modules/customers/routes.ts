import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  adminUpdateCustomerSchema,
  createCustomerSchema,
  listCustomersQuerySchema,
  updateOwnProfileSchema,
} from "./schema.js";
import * as service from "./service.js";

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
    res.status(201).json(await service.getCustomerById(user.id));
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
    const { search, page, pageSize } = req.query as unknown as {
      search?: string;
      page: number;
      pageSize: number;
    };
    res.json(await service.searchCustomers(search, page, pageSize));
  })
);

customersRouter.get(
  "/customers/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getCustomerById(requireParam(req, "id")));
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
