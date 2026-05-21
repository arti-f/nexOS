import { getCpuUsage } from "../services/system.js";
import { getMemory }   from "../services/system.js";
import { getNetworkStats } from "../services/network.js";

/**
 * WebSocket live metrics stream
 * Connect: ws://host:3001/api/v1/stream/metrics
 *
 * Sends a JSON frame every second:
 * {
 *   ts: number,
 *   cpu: { usage, iowait },
 *   ram: { percent, used, total },
 *   swap: { percent },
 *   net: [ { interface, rx_speed_mb, tx_speed_mb } ]
 * }
 */
export default async function streamRoutes(fastify) {
  fastify.get("/metrics", { websocket: true }, (socket, req) => {
    fastify.log.info("WS client connected: live metrics stream");

    let active = true;

    async function tick() {
      if (!active || socket.readyState !== 1 /* OPEN */) return;

      try {
        const [cpu, memory, net] = await Promise.all([
          getCpuUsage(),
          getMemory(),
          getNetworkStats(),
        ]);

        const frame = {
          ts:   Date.now(),
          cpu:  { usage: cpu.usage, iowait: cpu.iowait },
          ram:  { percent: memory.ram.percent, used: memory.ram.used, total: memory.ram.total },
          swap: { percent: memory.swap.percent },
          net:  net.map(n => ({
            interface:   n.interface,
            rx_speed_mb: n.rx_speed_mb,
            tx_speed_mb: n.tx_speed_mb,
          })),
        };

        socket.send(JSON.stringify(frame));
      } catch (err) {
        fastify.log.error("Stream tick error: " + err.message);
      }

      if (active) setTimeout(tick, 1000);
    }

    // Start streaming
    tick();

    socket.on("close", () => {
      active = false;
      fastify.log.info("WS client disconnected");
    });

    socket.on("error", (err) => {
      active = false;
      fastify.log.warn("WS error: " + err.message);
    });
  });

  // Ping / status for HTTP clients
  fastify.get("/status", async () => ({
    websocket_endpoint: "ws://<host>:3001/api/v1/stream/metrics",
    interval_ms: 1000,
    fields: ["cpu", "ram", "swap", "net"],
  }));
}
