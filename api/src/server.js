import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

import systemRoutes   from "./routes/system.js";
import dockerRoutes   from "./routes/docker.js";
import networkRoutes  from "./routes/network.js";
import processRoutes  from "./routes/processes.js";
import logsRoutes     from "./routes/logs.js";
import streamRoutes   from "./routes/stream.js";
import appStoreRoutes from "./routes/apps.js";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// ─── PLUGINS ─────────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

await fastify.register(websocket);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
await fastify.register(systemRoutes,   { prefix: "/api/v1/system"    });
await fastify.register(dockerRoutes,   { prefix: "/api/v1/docker"    });
await fastify.register(networkRoutes,  { prefix: "/api/v1/network"   });
await fastify.register(processRoutes,  { prefix: "/api/v1/processes" });
await fastify.register(logsRoutes,     { prefix: "/api/v1/logs"      });
await fastify.register(streamRoutes,   { prefix: "/api/v1/stream"    });
await fastify.register(appStoreRoutes, { prefix: "/api/v1/apps"      });

// ─── HEALTH ──────────────────────────────────────────────────────────────────
fastify.get("/health", async () => ({
  status: "ok",
  version: "1.0.0",
  timestamp: Date.now(),
}));

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "0.0.0.0";

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🟢 NexOS API running at http://${HOST}:${PORT}\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
