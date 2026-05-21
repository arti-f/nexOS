import {
  getCpuUsage, getCpuInfo,
  getMemory, getDisk, getDiskIO,
  getUptime, getHostInfo,
} from "../services/system.js";

export default async function systemRoutes(fastify) {
  // GET /api/v1/system
  // Full snapshot: CPU, RAM, disk, uptime, host info
  fastify.get("/", async (req, reply) => {
    const [cpu, cpuInfo, memory, disk, diskIO, uptime, host] = await Promise.all([
      getCpuUsage(),
      getCpuInfo(),
      getMemory(),
      getDisk(),
      getDiskIO(),
      getUptime(),
      getHostInfo(),
    ]);

    return {
      timestamp: Date.now(),
      host,
      cpu: { ...cpu, ...cpuInfo },
      memory,
      disk,
      disk_io: diskIO,
      uptime,
    };
  });

  // GET /api/v1/system/cpu
  fastify.get("/cpu", async () => {
    const [usage, info] = await Promise.all([getCpuUsage(), getCpuInfo()]);
    return { timestamp: Date.now(), ...usage, ...info };
  });

  // GET /api/v1/system/memory
  fastify.get("/memory", async () => {
    return { timestamp: Date.now(), ...(await getMemory()) };
  });

  // GET /api/v1/system/disk
  fastify.get("/disk", async () => {
    const [partitions, io] = await Promise.all([getDisk(), getDiskIO()]);
    return { timestamp: Date.now(), partitions, io };
  });

  // GET /api/v1/system/uptime
  fastify.get("/uptime", async () => {
    return { timestamp: Date.now(), ...(await getUptime()) };
  });

  // GET /api/v1/system/host
  fastify.get("/host", async () => {
    return { timestamp: Date.now(), ...(await getHostInfo()) };
  });
}
