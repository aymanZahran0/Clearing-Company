import { createApp } from "./app.js";
import { startScheduler } from "./lib/jobs/scheduler.js";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

// Vercel imports this module as a serverless function. Locally (and on a
// traditional Node host), retain the long-running HTTP server and scheduler.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`apps/api listening on :${port}`);
    startScheduler();
  });
}

export default app;
