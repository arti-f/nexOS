import Docker from "dockerode";

// Connect via Unix socket (default) or TCP
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
});

// ─── CONTAINERS ───────────────────────────────────────────────────────────────
export async function listContainers(all = true) {
  const containers = await docker.listContainers({ all });
  return containers.map(c => ({
    id:       c.Id.slice(0, 12),
    id_full:  c.Id,
    name:     c.Names[0]?.replace(/^\//, "") ?? "unknown",
    image:    c.Image,
    status:   c.Status,
    state:    c.State,
    created:  c.Created,
    ports:    c.Ports.map(p => ({
      private: p.PrivatePort,
      public:  p.PublicPort ?? null,
      type:    p.Type,
    })),
    networks: Object.keys(c.NetworkSettings?.Networks ?? {}),
  }));
}

// ─── CONTAINER STATS ─────────────────────────────────────────────────────────
export async function getContainerStats(id) {
  const container = docker.getContainer(id);
  const stats = await container.stats({ stream: false });

  // CPU %
  const cpuDelta    = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage      - stats.precpu_stats.system_cpu_usage;
  const numCpus     = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
  const cpuPercent  = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  // Memory
  const memUsage = stats.memory_stats.usage - (stats.memory_stats.stats?.cache ?? 0);
  const memLimit = stats.memory_stats.limit;
  const memPercent = memLimit > 0 ? (memUsage / memLimit) * 100 : 0;

  // Network
  const netStats = Object.values(stats.networks ?? {}).reduce(
    (acc, n) => ({ rx: acc.rx + n.rx_bytes, tx: acc.tx + n.tx_bytes }),
    { rx: 0, tx: 0 }
  );

  return {
    id: id.slice(0, 12),
    cpu_percent:  Math.round(cpuPercent * 100) / 100,
    mem_usage_mb: Math.round(memUsage / 1024 / 1024),
    mem_limit_mb: Math.round(memLimit / 1024 / 1024),
    mem_percent:  Math.round(memPercent * 10) / 10,
    net_rx_mb:    (netStats.rx / 1024 / 1024).toFixed(2),
    net_tx_mb:    (netStats.tx / 1024 / 1024).toFixed(2),
    pids:         stats.pids_stats?.current ?? 0,
  };
}

// ─── CONTAINER ACTIONS ────────────────────────────────────────────────────────
export async function startContainer(id) {
  const c = docker.getContainer(id);
  await c.start();
  return { ok: true, action: "start", id };
}

export async function stopContainer(id) {
  const c = docker.getContainer(id);
  await c.stop();
  return { ok: true, action: "stop", id };
}

export async function restartContainer(id) {
  const c = docker.getContainer(id);
  await c.restart();
  return { ok: true, action: "restart", id };
}

export async function removeContainer(id, force = false) {
  const c = docker.getContainer(id);
  await c.remove({ force });
  return { ok: true, action: "remove", id };
}

// ─── IMAGES ──────────────────────────────────────────────────────────────────
export async function listImages() {
  const images = await docker.listImages();
  return images.map(img => ({
    id:       img.Id.split(":")[1]?.slice(0, 12),
    tags:     img.RepoTags ?? [],
    size_mb:  Math.round(img.Size / 1024 / 1024),
    created:  img.Created,
  }));
}

// ─── VOLUMES ─────────────────────────────────────────────────────────────────
export async function listVolumes() {
  const { Volumes } = await docker.listVolumes();
  return (Volumes ?? []).map(v => ({
    name:       v.Name,
    driver:     v.Driver,
    mountpoint: v.Mountpoint,
    created:    v.CreatedAt,
  }));
}

// ─── DOCKER INFO ─────────────────────────────────────────────────────────────
export async function getDockerInfo() {
  const info = await docker.info();
  return {
    version:     info.ServerVersion,
    containers:  info.Containers,
    running:     info.ContainersRunning,
    paused:      info.ContainersPaused,
    stopped:     info.ContainersStopped,
    images:      info.Images,
    mem_total_mb: Math.round(info.MemTotal / 1024 / 1024),
    os:          info.OperatingSystem,
    kernel:      info.KernelVersion,
    cpus:        info.NCPU,
  };
}

// ─── CONTAINER LOGS ──────────────────────────────────────────────────────────
export async function getContainerLogs(id, tail = 100) {
  const c = docker.getContainer(id);
  const stream = await c.logs({
    stdout: true, stderr: true,
    tail, timestamps: true,
  });
  // Strip docker multiplexing header (8 bytes)
  const raw = stream.toString("utf8");
  return raw
    .split("\n")
    .filter(Boolean)
    .map(line => line.length > 8 ? line.slice(8) : line);
}
