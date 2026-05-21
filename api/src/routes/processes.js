import { getTopProcesses, killProcess, getProcessSummary } from "../services/processes.js";

export default async function processRoutes(fastify) {
  // GET /api/v1/processes
  fastify.get("/", async (req) => {
    const limit = parseInt(req.query.limit ?? "20");
    const [procs, summary] = await Promise.all([
      getTopProcesses(limit),
      getProcessSummary(),
    ]);
    return { timestamp: Date.now(), summary, processes: procs };
  });

  // GET /api/v1/processes/top
  fastify.get("/top", async (req) => {
    const limit = parseInt(req.query.limit ?? "10");
    return {
      timestamp: Date.now(),
      processes: await getTopProcesses(limit),
    };
  });

  // DELETE /api/v1/processes/:pid   — send signal
  fastify.delete("/:pid", {
    schema: {
      params: { type: "object", properties: { pid: { type: "integer" } }, required: ["pid"] },
      querystring: { type: "object", properties: { signal: { type: "string" } } },
    },
  }, async (req, reply) => {
    const signal = req.query.signal ?? "SIGTERM";
    try {
      return await killProcess(req.params.pid, signal);
    } catch (err) {
      reply.status(400).send({ ok: false, error: err.message });
    }
  });
}
