import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/requestLogger.js";
import { standardRateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/routes.js";
import { openapiRouter } from "./openapi/index.js";
import { serviceCategoriesRouter } from "./modules/service-categories/routes.js";
import { servicesRouter } from "./modules/services/routes.js";
import { serviceAddOnsRouter } from "./modules/service-add-ons/routes.js";
import { serviceAreasRouter } from "./modules/service-areas/routes.js";
import { publicStatsRouter } from "./modules/public-stats/routes.js";
import { pricingRulesRouter } from "./modules/pricing-rules/routes.js";
import { discountCodesRouter } from "./modules/discount-codes/routes.js";
import { availabilityRouter } from "./modules/availability/routes.js";
import { quotesRouter } from "./modules/quotes/routes.js";
import { addressesRouter } from "./modules/addresses/routes.js";
import { customersRouter } from "./modules/customers/routes.js";
import { bookingsRouter } from "./modules/bookings/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";
import { checklistsRouter } from "./modules/checklists/routes.js";
import { reviewsAndComplaintsRouter } from "./modules/reviews-and-complaints/routes.js";
import { subscriptionsRouter } from "./modules/subscriptions/routes.js";
import { commercialRouter } from "./modules/commercial/routes.js";
import { reportsRouter } from "./modules/reports/routes.js";
import { auditLogsRouter } from "./modules/audit-logs/routes.js";
import { websiteContentRouter } from "./modules/website-content/routes.js";
import { settingsRouter } from "./modules/settings/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { serviceImagesRouter } from "./modules/service-images/routes.js";
import { jobRunsRouter } from "./modules/job-runs/routes.js";
import { adminAccountsRouter } from "./modules/admin-accounts/routes.js";
import { rescheduleRequestsRouter } from "./modules/reschedule-requests/routes.js";
import { prisma } from "./lib/prisma.js";
import { getLocalUploadRoot } from "./lib/storage/factory.js";

export function createApp() {
  const app = express();

  // Order matters: logging first (captures everything), then security
  // headers, CORS, body parsing, rate limiting, routes, error handler last.
  app.use(requestLogger);
  app.use(helmet());
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(standardRateLimit);
  app.use(
    "/uploads",
    express.static(getLocalUploadRoot(), {
      setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
    })
  );

  // contracts/health-and-jobs.md: existing path/200-on-healthy contract
  // preserved; body now reports DB reachability for monitoring/alerting.
  app.get("/api/v1/health", async (_req, res) => {
    let db = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = false;
    }
    res.json({ status: db ? "ok" : "degraded", db, timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", openapiRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", serviceCategoriesRouter);
  app.use("/api/v1", servicesRouter);
  app.use("/api/v1", serviceAddOnsRouter);
  app.use("/api/v1", serviceAreasRouter);
  app.use("/api/v1", publicStatsRouter);
  app.use("/api/v1", pricingRulesRouter);
  app.use("/api/v1", discountCodesRouter);
  app.use("/api/v1", availabilityRouter);
  app.use("/api/v1", quotesRouter);
  app.use("/api/v1", addressesRouter);
  app.use("/api/v1", customersRouter);
  app.use("/api/v1", bookingsRouter);
  app.use("/api/v1", paymentsRouter);
  app.use("/api/v1", checklistsRouter);
  app.use("/api/v1", reviewsAndComplaintsRouter);
  app.use("/api/v1", subscriptionsRouter);
  app.use("/api/v1", commercialRouter);
  app.use("/api/v1", reportsRouter);
  app.use("/api/v1", auditLogsRouter);
  app.use("/api/v1", websiteContentRouter);
  app.use("/api/v1", settingsRouter);
  app.use("/api/v1", notificationsRouter);
  app.use("/api/v1", serviceImagesRouter);
  app.use("/api/v1", jobRunsRouter);
  app.use("/api/v1", adminAccountsRouter);
  app.use("/api/v1", rescheduleRequestsRouter);

  app.use(errorHandler);

  return app;
}
