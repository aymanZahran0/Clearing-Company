import { createApp } from "./app.js";
import { startScheduler } from "./lib/jobs/scheduler.js";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`apps/api listening on :${port}`);
  startScheduler();
});
