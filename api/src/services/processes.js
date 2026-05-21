import { readdir, readFile } from "fs/promises";

// ─── READ SINGLE PROCESS ─────────────────────────────────────────────────────
async function readProc(pid) {
  try {
    const [stat, status, cmdline] = await Promise.all([
      readFile(`/proc/${pid}/stat`,    "utf8"),
      readFile(`/proc/${pid}/status`,  "utf8"),
      readFile(`/proc/${pid}/cmdline", "utf8`),
    ]);

    const parts = stat.split(" ");
    // Extract name from stat (field 2, wrapped in parens)
    const nameMatch = stat.match(/\((.+?)\)/);
    const name = nameMatch ? nameMatch[1] : "unknown";

    // Fields after the name — state is field 3
    const afterName = stat.slice(stat.indexOf(")") + 2).split(" ");
    const utime  = parseInt(afterName[11]); // field 14
    const stime  = parseInt(afterName[12]); // field 15
    const vsize  = parseInt(afterName[20]); // virtual memory bytes
    const rss    = parseInt(afterName[21]); // resident set pages

    const getStatus = (key) => {
      const m = status.match(new RegExp(`^${key}:\\s+(.+)`, "m"));
      return m ? m[1].trim() : "";
    };

    const state  = getStatus("State").charAt(0);
    const uid    = getStatus("Uid").split(/\s+/)[0];

    return {
      pid:     parseInt(pid),
      name,
      state,
      uid,
      utime, stime,
      total_time: utime + stime,
      vsize_mb:  Math.round(vsize / 1024 / 1024),
      rss_kb:    rss * 4, // pages → KB (4KB pages on x86)
    };
  } catch {
    return null;
  }
}

// ─── GET CPU TICKS ───────────────────────────────────────────────────────────
async function getTotalCpuTime() {
  const raw = await readFile("/proc/stat", "utf8");
  const line = raw.split("\n").find(l => l.startsWith("cpu "));
  return line.trim().split(/\s+/).slice(1).map(Number).reduce((a, b) => a + b, 0);
}

// ─── TOP PROCESSES ───────────────────────────────────────────────────────────
let _prevProcs = {};
let _prevTotal = 0;

export async function getTopProcesses(limit = 20) {
  const [pids, totalCpu] = await Promise.all([
    readdir("/proc").then(entries => entries.filter(e => /^\d+$/.test(e))),
    getTotalCpuTime(),
  ]);

  const procs = (await Promise.all(pids.map(readProc))).filter(Boolean);

  const totalDelta = totalCpu - _prevTotal;

  const enriched = procs.map(p => {
    const prev = _prevProcs[p.pid];
    const cpuDelta = prev ? p.total_time - prev.total_time : 0;
    const cpuPct   = totalDelta > 0 ? (cpuDelta / totalDelta) * 100 : 0;
    return { ...p, cpu_percent: Math.round(cpuPct * 10) / 10 };
  });

  // Save state for next call
  _prevProcs = {};
  procs.forEach(p => { _prevProcs[p.pid] = p; });
  _prevTotal = totalCpu;

  // Sort by CPU descending, take top N
  return enriched
    .filter(p => p.state !== "Z") // exclude zombies
    .sort((a, b) => b.cpu_percent - a.cpu_percent)
    .slice(0, limit)
    .map(p => ({
      pid:        p.pid,
      name:       p.name,
      state:      p.state,
      cpu_percent: p.cpu_percent,
      mem_mb:     Math.round(p.rss_kb / 1024),
      mem_kb:     p.rss_kb,
      vsize_mb:   p.vsize_mb,
    }));
}

// ─── KILL PROCESS ────────────────────────────────────────────────────────────
export async function killProcess(pid, signal = "SIGTERM") {
  try {
    process.kill(pid, signal);
    return { ok: true, pid, signal };
  } catch (err) {
    throw new Error(`Failed to kill PID ${pid}: ${err.message}`);
  }
}

// ─── PROCESS SUMMARY ─────────────────────────────────────────────────────────
export async function getProcessSummary() {
  const pids = await readdir("/proc").then(e => e.filter(p => /^\d+$/.test(p)));
  return {
    total:     pids.length,
    running:   0, // populated lazily in full call
    timestamp: Date.now(),
  };
}
