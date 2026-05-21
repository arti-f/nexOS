import {
  getNetworkStats, getInterfaceAddresses,
  getConnectionCount, getDNSServers,
} from "../services/network.js";

export default async function networkRoutes(fastify) {
  // GET /api/v1/network
  fastify.get("/", async () => {
    const [stats, addresses, connections, dns] = await Promise.all([
      getNetworkStats(),
      getInterfaceAddresses(),
      getConnectionCount(),
      getDNSServers(),
    ]);
    // Merge stats + addresses by interface name
    const merged = stats.map(s => {
      const addr = addresses.find(a => a.name === s.interface) ?? {};
      return { ...s, ...addr };
    });
    return { timestamp: Date.now(), interfaces: merged, connections, dns };
  });

  // GET /api/v1/network/stats
  fastify.get("/stats", async () => {
    return { timestamp: Date.now(), interfaces: await getNetworkStats() };
  });

  // GET /api/v1/network/interfaces
  fastify.get("/interfaces", async () => {
    return { timestamp: Date.now(), interfaces: await getInterfaceAddresses() };
  });

  // GET /api/v1/network/connections
  fastify.get("/connections", async () => {
    return { timestamp: Date.now(), ...(await getConnectionCount()) };
  });

  // GET /api/v1/network/dns
  fastify.get("/dns", async () => {
    return { timestamp: Date.now(), ...(await getDNSServers()) };
  });
}
