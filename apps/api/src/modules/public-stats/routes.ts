import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as service from "./service.js";

export const publicStatsRouter = Router();

publicStatsRouter.get(
  "/public/stats",
  asyncHandler(async (_req, res) => {
    res.json(await service.getPublicStats());
  })
);
