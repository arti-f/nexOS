import {
  listContainers, getContainerStats,
  startContainer, stopContainer,
  restartContainer, removeContainer,
  listImages, listVolumes,
  getDockerInfo, getContainerLogs,
} from "../services/docker.js";

export default async function dockerRoutes(fastify) {
  // GET /api/v1/docker
  fastify.get("/", async () => {
    const [info, containers] = await Promise.all([
      getDockerInfo(),
      listContainers(true),
    ]);
    return { timestamp: Date.now(), info, containers };
  });

  // GET /api/v1/docker/containers
  fastify.get("/containers", async (req) => {
    const all = req.query.all !== "false";
    return listContainers(all);
  });

  // GET /api/v1/docker/containers/:id/stats
  fastify.get("/containers/:id/stats", async (req) => {
    return getContainerStats(req.params.id);
  });

  // GET /api/v1/docker/containers/:id/logs
  fastify.get("/containers/:id/logs", async (req) => {
    const tail = parseInt(req.query.tail ?? "100");
    return { logs: await getContainerLogs(req.params.id, tail) };
  });

  // POST /api/v1/docker/containers/:id/start
  fastify.post("/containers/:id/start", async (req) => {
    return startContainer(req.params.id);
  });

  // POST /api/v1/docker/containers/:id/stop
  fastify.post("/containers/:id/stop", async (req) => {
    return stopContainer(req.params.id);
  });

  // POST /api/v1/docker/containers/:id/restart
  fastify.post("/containers/:id/restart", async (req) => {
    return restartContainer(req.params.id);
  });

  // DELETE /api/v1/docker/containers/:id
  fastify.delete("/containers/:id", async (req) => {
    const force = req.query.force === "true";
    return removeContainer(req.params.id, force);
  });

  // GET /api/v1/docker/images
  fastify.get("/images", async () => {
    return listImages();
  });

  // GET /api/v1/docker/volumes
  fastify.get("/volumes", async () => {
    return listVolumes();
  });

  // GET /api/v1/docker/info
  fastify.get("/info", async () => {
    return getDockerInfo();
  });
}
