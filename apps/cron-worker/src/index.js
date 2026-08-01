async function runMaintenance(env) {
  const response = await fetch(env.API_CRON_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Maintenance API returned HTTP ${response.status}`);
  }

  console.log(
    JSON.stringify({
      event: "maintenance_complete",
      status: response.status,
      timestamp: new Date().toISOString(),
    })
  );
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runMaintenance(env));
  },

  fetch() {
    return Response.json({ status: "ok", scheduler: "nuqaa-asir-maintenance-cron" });
  },
};
