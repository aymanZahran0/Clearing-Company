import express from "express";
import cors from "cors";
import { createRequire } from "node:module";
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
import { reportsRouter } from "./modules/reports/routes.js";
import { websiteContentRouter } from "./modules/website-content/routes.js";
import { socialMediaRouter } from "./modules/social-media/routes.js";
import { settingsRouter } from "./modules/settings/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { serviceImagesRouter } from "./modules/service-images/routes.js";
import { rescheduleRequestsRouter } from "./modules/reschedule-requests/routes.js";
import { prisma } from "./lib/prisma.js";
import { getLocalUploadRoot } from "./lib/storage/factory.js";
import { runJob } from "./lib/jobs/scheduler.js";
import { expireStaleQuotes } from "./jobs/expireStaleQuotes.js";
import { generateSubscriptionOccurrences } from "./jobs/generateSubscriptionOccurrences.js";

// Vercel's Express builder resolves Helmet through its CommonJS declaration.
// Loading it explicitly keeps the callable export correctly typed in ESM.
const require = createRequire(import.meta.url);
const helmet: typeof import("helmet").default = require("helmet");

export function createApp() {
  const app = express();

  // Vercel terminates TLS and forwards the client IP through one trusted
  // proxy hop. This is required for accurate express-rate-limit keys.
  app.set("trust proxy", 1);

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

  // Vercel Cron invokes this endpoint with `Authorization: Bearer <CRON_SECRET>`.
  // The database advisory locks make duplicate/overlapping invocations safe.
  app.get("/api/v1/cron/maintenance", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      return;
    }

    await Promise.all([
      runJob("EXPIRE_STALE_QUOTES", expireStaleQuotes),
      runJob("GENERATE_SUBSCRIPTION_OCCURRENCES", generateSubscriptionOccurrences),
    ]);
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", openapiRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", serviceCategoriesRouter);
  app.use("/api/v1", servicesRouter);
  app.use("/api/v1", serviceAddOnsRouter);
  app.use("/api/v1", serviceAreasRouter);
  app.use("/api/v1", publicStatsRouter);
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
  app.use("/api/v1", reportsRouter);
  app.use("/api/v1", websiteContentRouter);
  app.use("/api/v1", socialMediaRouter);
  app.use("/api/v1", settingsRouter);
  app.use("/api/v1", notificationsRouter);
  app.use("/api/v1", serviceImagesRouter);
  app.use("/api/v1", rescheduleRequestsRouter);

  app.use(errorHandler);

  return app;
}

// Vercel detects src/app.ts as the Express entrypoint and requires the app
// instance as the default export. Local development imports the same instance.
export const app = createApp();
export default app;
