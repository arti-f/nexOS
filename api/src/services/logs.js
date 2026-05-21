import { execFile } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";

const exec = promisify(execFile);

// ─── JOURNALD ────────────────────────────────────────────────────────────────
export async function getSystemLogs({ lines = 100, unit = null, since = null, priority = null } = {}) {
  const args = [
    "--no-pager",
    "--output=json",
    `-n${lines}`,
  ];

  if (unit)     args.push(`--unit=${unit}`);
  if (since)    args.push(`--since=${since}`);
  if (priority) args.push(`-p${priority}`); // 0=emerg, 3=err, 4=warn, 6=info, 7=debug

  try {
    const { stdout } = await exec("journalctl", args);
    const entries = stdout.trim().split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          const e = JSON.parse(line);
          return {
            timestamp: parseInt(e.__REALTIME_TIMESTAMP) / 1000, // µs → ms
            unit:      e._SYSTEMD_UNIT ?? e.SYSLOG_IDENTIFIER ?? "kernel",
            message:   e.MESSAGE ?? "",
            priority:  parseInt(e.PRIORITY ?? "6"),
            pid:       e._PID ? parseInt(e._PID) : null,
          };
        } catch { return null; }
      })
      .filter(Boolean)
      .reverse(); // newest first

    return entries;
  } catch {
    // journalctl not available (e.g. container without systemd) — fallback
    return getKernelLogs(lines);
  }
}

// ─── KERNEL RING BUFFER ──────────────────────────────────────────────────────
export async function getKernelLogs(lines = 50) {
  try {
    const { stdout } = await exec("dmesg", ["--time-format=iso", "--decode", `-n${lines}`]);
    return stdout.trim().split("\n").slice(-lines).map((line, i) => ({
      timestamp: Date.now() - (lines - i) * 1000,
      unit:      "kernel",
      message:   line,
      priority:  6,
      pid:       null,
    })).reverse();
  } catch {
    return [];
  }
}

// ─── AUTH LOG ────────────────────────────────────────────────────────────────
export async function getAuthLogs(lines = 50) {
  const paths = ["/var/log/auth.log", "/var/log/secure"];
  for (const path of paths) {
    try {
      const raw = await readFile(path, "utf8");
      return raw.trim().split("\n").slice(-lines).reverse().map((line, i) => ({
        line: i + 1,
        raw:  line,
        is_failure: /fail|invalid|refused|error/i.test(line),
      }));
    } catch {}
  }
  return [];
}

// ─── AVAILABLE UNITS ─────────────────────────────────────────────────────────
export async function listSystemdUnits() {
  try {
    const { stdout } = await exec("systemctl", ["list-units", "--type=service", "--state=active", "--no-pager", "--output=json"]);
    return JSON.parse(stdout).map(u => ({
      name:        u.unit,
      load:        u.load,
      active:      u.active,
      sub:         u.sub,
      description: u.description,
    }));
  } catch {
    return [];
  }
}
