import { Router } from "express";
import { tryAuthenticate } from "../../middleware/tryAuthenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { quoteEstimateRequestSchema } from "./schema.js";
import * as service from "./service.js";

export const quotesRouter = Router();

quotesRouter.post(
  "/quotes/estimate",
  tryAuthenticate,
  validateRequest({ body: quoteEstimateRequestSchema }),
  asyncHandler(async (req, res) => {
    const customerId = req.user?.role === "CUSTOMER" ? req.user.id : undefined;
    const quote = await service.estimateQuote(req.body, customerId);
    res.status(200).json(quote);
  })
);

quotesRouter.get(
  "/quotes/:id",
  tryAuthenticate,
  asyncHandler(async (req, res) => {
    const quote = await service.getQuoteById(requireParam(req, "id"));
    res.json(quote);
  })
);
