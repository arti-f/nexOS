import { readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

// ─── INTERFACE STATS ─────────────────────────────────────────────────────────
let _prevNet = {};

export async function getNetworkStats() {
  const raw = await readFile("/proc/net/dev", "utf8");
  const now = Date.now();
  const lines = raw.trim().split("\n").slice(2); // skip header

  const parsed = {};
  for (const line of lines) {
    const [iface, ...nums] = line.trim().split(/[:\s]+/);
    if (!iface || iface === "lo") continue;
    parsed[iface] = {
      rx_bytes: parseInt(nums[0]),
      rx_packets: parseInt(nums[1]),
      rx_errors: parseInt(nums[2]),
      rx_drop: parseInt(nums[3]),
      tx_bytes: parseInt(nums[8]),
      tx_packets: parseInt(nums[9]),
      tx_errors: parseInt(nums[10]),
      ts: now,
    };
  }

  // Calculate speed (bytes/sec) from delta
  const result = [];
  for (const [iface, cur] of Object.entries(parsed)) {
    const prev = _prevNet[iface];
    let rx_speed = 0, tx_speed = 0;

    if (prev) {
      const dt = (cur.ts - prev.ts) / 1000;
      rx_speed = Math.max(0, Math.round((cur.rx_bytes - prev.rx_bytes) / dt));
      tx_speed = Math.max(0, Math.round((cur.tx_bytes - prev.tx_bytes) / dt));
    }

    result.push({
      interface: iface,
      rx_bytes:   cur.rx_bytes,
      tx_bytes:   cur.tx_bytes,
      rx_packets: cur.rx_packets,
      tx_packets: cur.tx_packets,
      rx_errors:  cur.rx_errors,
      tx_errors:  cur.tx_errors,
      rx_drop:    cur.rx_drop,
      // Human-readable speeds
      rx_speed,
      tx_speed,
      rx_speed_mb: (rx_speed / 1024 / 1024).toFixed(2),
      tx_speed_mb: (tx_speed / 1024 / 1024).toFixed(2),
    });
  }

  _prevNet = parsed;
  return result;
}

// ─── IP ADDRESSES ─────────────────────────────────────────────────────────────
export async function getInterfaceAddresses() {
  try {
    const { stdout } = await exec("ip", ["-j", "addr"]);
    const data = JSON.parse(stdout);
    return data.map(iface => ({
      name: iface.ifname,
      mac:  iface.address,
      state: iface.operstate,
      mtu:   iface.mtu,
      addresses: (iface.addr_info || []).map(a => ({
        family:    a.family,
        address:   a.local,
        prefix:    a.prefixlen,
        broadcast: a.broadcast,
      })),
    }));
  } catch {
    return [];
  }
}

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────
export async function getConnectionCount() {
  try {
    const raw = await readFile("/proc/net/tcp", "utf8");
    const raw6 = await readFile("/proc/net/tcp6", "utf8").catch(() => "");
    const count = (raw.trim().split("\n").length - 1) +
                  (raw6 ? raw6.trim().split("\n").length - 1 : 0);
    return { tcp_connections: Math.max(0, count) };
  } catch {
    return { tcp_connections: 0 };
  }
}

// ─── DNS ─────────────────────────────────────────────────────────────────────
export async function getDNSServers() {
  try {
    const raw = await readFile("/etc/resolv.conf", "utf8");
    const nameservers = raw
      .split("\n")
      .filter(l => l.startsWith("nameserver"))
      .map(l => l.split(/\s+/)[1]);
    return { nameservers };
  } catch {
    return { nameservers: [] };
  }
}
