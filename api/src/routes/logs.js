import { getSystemLogs, getKernelLogs, getAuthLogs, listSystemdUnits } from "../services/logs.js";

export default async function logsRoutes(fastify) {
  // GET /api/v1/logs
  fastify.get("/", async (req) => {
    const lines    = parseInt(req.query.lines ?? "100");
    const unit     = req.query.unit    ?? null;
    const since    = req.query.since   ?? null;
    const priority = req.query.priority ?? null;
    return {
      timestamp: Date.now(),
      logs: await getSystemLogs({ lines, unit, since, priority }),
    };
  });

  // GET /api/v1/logs/kernel
  fastify.get("/kernel", async (req) => {
    const lines = parseInt(req.query.lines ?? "50");
    return { timestamp: Date.now(), logs: await getKernelLogs(lines) };
  });

  // GET /api/v1/logs/auth
  fastify.get("/auth", async (req) => {
    const lines = parseInt(req.query.lines ?? "50");
    return { timestamp: Date.now(), logs: await getAuthLogs(lines) };
  });

  // GET /api/v1/logs/units
  fastify.get("/units", async () => {
    return { timestamp: Date.now(), units: await listSystemdUnits() };
  });
}
