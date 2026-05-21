import { readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

// ─── CPU ─────────────────────────────────────────────────────────────────────
// Reads /proc/stat twice with a 200ms interval to calculate real usage %
let _prevCpu = null;

async function readCpuRaw() {
  const raw = await readFile("/proc/stat", "utf8");
  const line = raw.split("\n").find(l => l.startsWith("cpu "));
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  const [user, nice, system, idle, iowait, irq, softirq, steal] = parts;
  const total = parts.reduce((a, b) => a + b, 0);
  const idle_total = idle + iowait;
  return { total, idle: idle_total, iowait };
}

export async function getCpuUsage() {
  const a = _prevCpu || (await readCpuRaw());
  await new Promise(r => setTimeout(r, 200));
  const b = await readCpuRaw();
  _prevCpu = b;

  const totalDiff = b.total - a.total;
  const idleDiff  = b.idle  - a.idle;
  const usage = totalDiff === 0 ? 0 : Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
  const iowait = totalDiff === 0 ? 0 : Math.round(((b.iowait - a.iowait) / totalDiff) * 100);
  return { usage: Math.min(100, Math.max(0, usage)), iowait };
}

export async function getCpuInfo() {
  const raw = await readFile("/proc/cpuinfo", "utf8");
  const lines = raw.split("\n");
  const get = (key) => lines.find(l => l.startsWith(key))?.split(":")[1]?.trim() ?? "unknown";
  const cores = lines.filter(l => l.startsWith("processor")).length;
  return {
    model: get("model name"),
    cores,
    architecture: process.arch,
  };
}

// ─── MEMORY ──────────────────────────────────────────────────────────────────
export async function getMemory() {
  const raw = await readFile("/proc/meminfo", "utf8");
  const val = (key) => {
    const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, "m"));
    return match ? parseInt(match[1]) * 1024 : 0; // kB → bytes
  };

  const total    = val("MemTotal");
  const free     = val("MemFree");
  const buffers  = val("Buffers");
  const cached   = val("Cached") + val("SReclaimable") - val("Shmem");
  const available = val("MemAvailable");
  const used     = total - available;

  const swapTotal = val("SwapTotal");
  const swapFree  = val("SwapFree");
  const swapUsed  = swapTotal - swapFree;

  const toMB = (b) => Math.round(b / 1024 / 1024);
  const pct  = (used, total) => total === 0 ? 0 : Math.round((used / total) * 100);

  return {
    ram: {
      total:     toMB(total),
      used:      toMB(used),
      free:      toMB(free),
      buffers:   toMB(buffers),
      cached:    toMB(cached),
      available: toMB(available),
      percent:   pct(used, total),
    },
    swap: {
      total:   toMB(swapTotal),
      used:    toMB(swapUsed),
      free:    toMB(swapFree),
      percent: pct(swapUsed, swapTotal),
    },
  };
}

// ─── DISK ────────────────────────────────────────────────────────────────────
export async function getDisk() {
  try {
    const { stdout } = await exec("df", ["-BM", "--output=source,target,fstype,size,used,avail,pcent", "-x", "tmpfs", "-x", "devtmpfs"]);
    const lines = stdout.trim().split("\n").slice(1);
    return lines.map(line => {
      const [source, target, fstype, size, used, avail, pcent] = line.trim().split(/\s+/);
      return {
        device:  source,
        mount:   target,
        fstype,
        size:    parseInt(size),
        used:    parseInt(used),
        avail:   parseInt(avail),
        percent: parseInt(pcent),
      };
    }).filter(d => d.mount !== undefined);
  } catch {
    return [];
  }
}

// ─── IO WAIT (from /proc/diskstats) ─────────────────────────────────────────
let _prevDisk = null;

export async function getDiskIO() {
  const raw = await readFile("/proc/diskstats", "utf8");
  const lines = raw.trim().split("\n");

  // Filter real block devices (sda, nvme0n1, vda, etc.)
  const disks = lines
    .map(l => l.trim().split(/\s+/))
    .filter(p => /^(sd[a-z]|nvme\d+n\d+|vd[a-z]|xvd[a-z])$/.test(p[2]));

  if (!disks.length) return { read_kbs: 0, write_kbs: 0 };

  const now = Date.now();
  const totals = disks.reduce((acc, p) => ({
    reads:  acc.reads  + parseInt(p[5])  * 512,
    writes: acc.writes + parseInt(p[9])  * 512,
  }), { reads: 0, writes: 0 });

  if (!_prevDisk) {
    _prevDisk = { ...totals, ts: now };
    return { read_kbs: 0, write_kbs: 0 };
  }

  const dt = (now - _prevDisk.ts) / 1000;
  const read_kbs  = Math.round((totals.reads  - _prevDisk.reads)  / dt / 1024);
  const write_kbs = Math.round((totals.writes - _prevDisk.writes) / dt / 1024);
  _prevDisk = { ...totals, ts: now };

  return { read_kbs: Math.max(0, read_kbs), write_kbs: Math.max(0, write_kbs) };
}

// ─── UPTIME ──────────────────────────────────────────────────────────────────
export async function getUptime() {
  const raw = await readFile("/proc/uptime", "utf8");
  const seconds = parseFloat(raw.split(" ")[0]);

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return {
    seconds: Math.floor(seconds),
    human: `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`,
  };
}

// ─── HOSTNAME & OS ───────────────────────────────────────────────────────────
export async function getHostInfo() {
  const [hostname, osRelease] = await Promise.all([
    readFile("/etc/hostname", "utf8").then(s => s.trim()).catch(() => "unknown"),
    readFile("/etc/os-release", "utf8").catch(() => ""),
  ]);

  const get = (key) => {
    const match = osRelease.match(new RegExp(`^${key}="?([^"\\n]+)"?`, "m"));
    return match ? match[1] : "unknown";
  };

  // kernel version
  let kernel = "unknown";
  try {
    const { stdout } = await exec("uname", ["-r"]);
    kernel = stdout.trim();
  } catch {}

  return {
    hostname,
    os:           get("PRETTY_NAME"),
    os_id:        get("ID"),
    os_version:   get("VERSION_ID"),
    kernel,
    arch:         process.arch,
  };
}
