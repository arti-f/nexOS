import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0: "#080910", bg1: "#0d0f14", bg2: "#12151d", bg3: "#171b26", bg4: "#1d2235",
  acc:  "#00e5ff", acc2: "#7c3aed", acc3: "#00d68f", acc4: "#ffb547", accR: "#ff4d6d",
  accP: "#e040fb",
  txt: "#dde3f0", txt2: "#7a8499", txt3: "#3d4558",
  ff: "'Syne', sans-serif", mono: "'JetBrains Mono', monospace",
};

// ─── INLINE STYLES ────────────────────────────────────────────────────────────
const css = {
  root: {
    display: "grid", gridTemplateColumns: "240px 1fr", gridTemplateRows: "52px 1fr",
    minHeight: "100vh", background: T.bg0, color: T.txt, fontFamily: T.ff,
    fontSize: 13, overflow: "hidden",
  },
  topbar: {
    gridColumn: "1/-1", background: T.bg1,
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
    display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
    position: "sticky", top: 0, zIndex: 200,
    backdropFilter: "blur(12px)",
  },
  sidebar: {
    background: T.bg1, borderRight: `1px solid rgba(255,255,255,0.05)`,
    display: "flex", flexDirection: "column", overflowY: "auto",
    padding: "12px 10px",
  },
  main: {
    background: T.bg0, overflowY: "auto", padding: 20,
    display: "flex", flexDirection: "column", gap: 16,
  },
};

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 38, ram: 61, disk: 43, net_down: 12.4, net_up: 3.1,
    swap: 22, gpu: 55, io: 34,
    uptime: "14d 06h 22m",
    history: Array.from({ length: 60 }, () => 20 + Math.random() * 45),
  });

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => {
        const cpu = Math.max(5, Math.min(98, prev.cpu + (Math.random() - 0.48) * 8));
        const newHist = [...prev.history.slice(1), Math.round(cpu)];
        return {
          ...prev, cpu: Math.round(cpu),
          ram: Math.max(20, Math.min(96, prev.ram + (Math.random() - 0.5) * 3)),
          net_down: +(Math.max(0.1, prev.net_down + (Math.random() - 0.5) * 2)).toFixed(1),
          net_up: +(Math.max(0.01, prev.net_up + (Math.random() - 0.5) * 0.5)).toFixed(2),
          history: newHist,
        };
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return metrics;
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = T.acc, height = 64 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth || 400, H = height;
    canvas.width = W; canvas.height = H;
    const max = Math.max(...data, 1);
    const step = W / (data.length - 1);
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step, y = H - (v / max) * H * 0.92 - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color.replace(")", ", 0.18)").replace("rgb", "rgba").replace("hsl", "hsla") || `${color}30`);
    grad.addColorStop(1, "transparent");
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = `${color}18`;
    ctx.fill();
  }, [data, color, height]);
  return <canvas ref={ref} style={{ width: "100%", height, display: "block" }} />;
}

// ─── MINI BAR ────────────────────────────────────────────────────────────────
function MiniBar({ value, color = T.acc, height = 5 }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 3, height, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 3,
        background: color,
        width: `${Math.min(100, value)}%`,
        transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        boxShadow: `0 0 6px ${color}60`,
      }} />
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, trend, trendVal, color, children }) {
  const colorMap = {
    cyan: T.acc, purple: T.acc2, green: T.acc3, amber: T.acc4, red: T.accR, pink: T.accP,
  };
  const c = colorMap[color] || T.acc;
  return (
    <div style={{
      background: T.bg1, border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: 14, padding: 16, position: "relative", overflow: "hidden",
      transition: "border 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${c}30`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c, opacity: 0.8 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center",
          justifyContent: "center", background: `${c}15`, color: c, fontSize: 17,
        }}>{icon}</div>
        {trendVal && (
          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontFamily: T.mono,
            background: trend === "up" ? `${T.acc3}18` : `${T.accR}18`,
            color: trend === "up" ? T.acc3 : T.accR,
          }}>{trend === "up" ? "▲" : "▼"} {trendVal}</span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, color: T.txt }}>
        {value}<span style={{ fontSize: 14, color: T.txt2, fontWeight: 500, marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: T.txt2, marginTop: 4 }}>{label}</div>
      {children && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

// ─── NAV ITEM ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, badge, badgeColor = T.acc2, active, onClick }) {
  const bc = { green: T.acc3, amber: T.acc4, red: T.accR, cyan: T.acc }[badgeColor] || badgeColor;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
      borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
      color: active ? T.acc : T.txt2, fontSize: 12, fontWeight: 500,
      background: active ? `${T.acc}0d` : "transparent",
      border: active ? `1px solid ${T.acc}20` : "1px solid transparent",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.bg3; e.currentTarget.style.color = T.txt; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.txt2; } }}
    >
      <span style={{ fontSize: 16, width: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 10,
          background: bc, color: ["#ffb547", T.acc4].includes(bc) ? "#000" : "#fff",
          fontFamily: T.mono,
        }}>{badge}</span>
      )}
    </div>
  );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard({ icon, name, sub, status, uptime }) {
  const sColor = { online: T.acc3, warning: T.acc4, offline: T.accR }[status] || T.txt3;
  return (
    <div style={{
      background: T.bg2, border: `1px solid rgba(255,255,255,0.05)`,
      borderRadius: 10, padding: 12, display: "flex", alignItems: "flex-start",
      gap: 10, cursor: "pointer", transition: "all 0.18s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)"; e.currentTarget.style.background = T.bg3; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.background = T.bg2; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18, background: T.bg3, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 10, color: T.txt2 }}>{sub}</div>
        {uptime && <div style={{ fontSize: 10, color: T.txt3, marginTop: 4, fontFamily: T.mono }}>{uptime}</div>}
      </div>
      <div style={{
        width: 7, height: 7, borderRadius: "50%", background: sColor, flexShrink: 0, marginTop: 4,
        boxShadow: status === "online" ? `0 0 7px ${sColor}` : "none",
      }} />
    </div>
  );
}

// ─── UPTIME GRAPH ─────────────────────────────────────────────────────────────
function UptimeGraph({ days = 90 }) {
  const boxes = useRef(Array.from({ length: days }, () => {
    const r = Math.random();
    return r > 0.04 ? "online" : r > 0.015 ? "maint" : "down";
  })).current;
  const colorMap = { online: T.acc3, maint: T.bg4, down: T.accR };
  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {boxes.map((s, i) => (
        <div key={i} title={`Day ${days - i}: ${s}`} style={{
          width: 7, height: 14, borderRadius: 2,
          background: colorMap[s], opacity: s === "maint" ? 0.5 : 1,
        }} />
      ))}
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, color: T.txt3, letterSpacing: "1.5px",
      textTransform: "uppercase", padding: "12px 10px 5px", fontWeight: 600,
    }}>{children}</div>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.bg1, border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: 14, padding: 16, ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      {action && <span style={{ fontSize: 11, color: T.acc, cursor: "pointer", fontWeight: 600 }}>{action}</span>}
    </div>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "🐘", name: "PostgreSQL", sub: "Port 5432 · v16.2", status: "online", uptime: "↑ 14d 06h" },
  { icon: "🔴", name: "Redis", sub: "Port 6379 · v7.2", status: "online", uptime: "↑ 14d 06h" },
  { icon: "🐳", name: "Portainer", sub: "Port 9443 · v2.21", status: "online", uptime: "↑ 8d 14h" },
  { icon: "📊", name: "Grafana", sub: "Port 3000 · v10.4", status: "warning", uptime: "↑ 3d 02h" },
  { icon: "🔀", name: "Nginx Proxy", sub: "Port 443 · v1.26", status: "online", uptime: "↑ 14d 06h" },
  { icon: "🌐", name: "WireGuard", sub: "Port 51820 · VPN", status: "online", uptime: "↑ 14d 06h" },
];

const PROCESSES = [
  { name: "postgres", cpu: 8.2, mem: "412M", color: T.acc },
  { name: "docker-proxy", cpu: 5.6, mem: "280M", color: T.acc2 },
  { name: "grafana", cpu: 4.1, mem: "310M", color: T.acc3 },
  { name: "nginx", cpu: 2.0, mem: "48M", color: T.acc4 },
  { name: "sshd", cpu: 0.8, mem: "12M", color: T.accR },
];

const EVENTS = [
  { type: "ok", icon: "✓", msg: <>Container <code style={{ color: T.acc, fontFamily: T.mono }}>nginx-proxy</code> restarted successfully</>, time: "2m ago · system.daemon" },
  { type: "warn", icon: "⚠", msg: <>High memory on <code style={{ color: T.acc, fontFamily: T.mono }}>grafana</code> — 94% of limit</>, time: "18m ago · docker.monitor" },
  { type: "info", icon: "ℹ", msg: <>SSL cert for <code style={{ color: T.acc, fontFamily: T.mono }}>nexos.local</code> renewed. Expires in 89 days</>, time: "2h ago · certbot" },
  { type: "err", icon: "✕", msg: <>Failed login from <code style={{ fontFamily: T.mono }}>103.45.67.89</code> — blocked by firewall</>, time: "4h ago · security.fw" },
  { type: "ok", icon: "↓", msg: <>Kernel updated: <code style={{ fontFamily: T.mono, color: T.acc }}>6.6.31</code> → <code style={{ fontFamily: T.mono, color: T.acc3 }}>6.6.33</code></>, time: "Yesterday · pacman" },
];

const EVENT_COLORS = { ok: T.acc3, warn: T.acc4, info: T.acc, err: T.accR };

const NAV = [
  {
    section: "Monitor", items: [
      { icon: "⬡", label: "Overview", badge: null, active: true },
      { icon: "⚙", label: "Processes", badge: "5", badgeColor: "cyan" },
      { icon: "📈", label: "Metrics", badge: null },
      { icon: "🔔", label: "Alerts", badge: "2", badgeColor: "red" },
    ]
  },
  {
    section: "System", items: [
      { icon: "🧩", label: "Applications", badge: "12", badgeColor: T.acc2 },
      { icon: "💾", label: "Storage", badge: null },
      { icon: "🌐", label: "Network", badge: null },
      { icon: "🔒", label: "Security", badge: "1", badgeColor: "amber" },
    ]
  },
  {
    section: "Config", items: [
      { icon: "🐳", label: "Docker", badge: "6", badgeColor: "cyan" },
      { icon: "🔑", label: "SSH Keys", badge: null },
      { icon: "⚡", label: "Cron Jobs", badge: "3" },
      { icon: "📋", label: "Logs", badge: null },
    ]
  },
];

// ─── TOPBAR ────────────────────────────────────────────────────────────────────
function Topbar({ time }) {
  const timeStr = time.toLocaleTimeString("en-GB", { hour12: false });
  return (
    <div style={css.topbar}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 220, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${T.acc2}, ${T.acc})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#000",
        }}>N</div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5 }}>Nex<span style={{ color: T.acc }}>OS</span></span>
        <span style={{
          fontSize: 9, padding: "2px 6px", borderRadius: 6,
          background: `${T.acc2}25`, color: T.acc2, fontFamily: T.mono, marginLeft: 2,
        }}>v1.0.0</span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          background: T.bg2, border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 9, padding: "6px 12px", display: "flex", alignItems: "center",
          gap: 8, width: 280, color: T.txt3,
        }}>
          <span style={{ fontSize: 14 }}>⌕</span>
          <input placeholder="Search apps, files, settings..." style={{
            background: "transparent", border: "none", outline: "none",
            color: T.txt, fontFamily: T.ff, fontSize: 12, flex: 1,
          }} />
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.txt3 }}>⌘K</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.txt2, fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.acc3, display: "inline-block", boxShadow: `0 0 6px ${T.acc3}` }} />
          <span>System Healthy</span>
        </div>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />
        {["🔔", "🌙", "⚙"].map((ic, i) => (
          <button key={i} style={{
            background: T.bg2, border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 8, padding: "5px 9px", color: T.txt2, cursor: "pointer",
            fontSize: 14, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.acc; e.currentTarget.style.borderColor = `${T.acc}30`; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >{ic}</button>
        ))}
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.txt2, letterSpacing: 0.5 }}>{timeStr}</div>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `linear-gradient(135deg, ${T.acc2}, ${T.acc})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#000",
        }}>A</div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const [active, setActive] = useState("Overview");
  return (
    <div style={css.sidebar}>
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <SectionLabel>{section}</SectionLabel>
          {items.map(({ icon, label, badge, badgeColor }) => (
            <NavItem key={label} icon={icon} label={label} badge={badge}
              badgeColor={badgeColor} active={active === label}
              onClick={() => setActive(label)} />
          ))}
        </div>
      ))}

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ fontSize: 10, color: T.txt3, padding: "8px 10px", fontFamily: T.mono }}>
          <div>nexos-host · 192.168.1.50</div>
          <div style={{ marginTop: 3 }}>Arch Linux · Kernel 6.6.33</div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ metrics }) {
  return (
    <div style={css.main}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1 }}>System Overview</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>
            Last updated: just now · Uptime: {metrics.uptime}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Export", "Schedule"].map((l, i) => (
            <button key={l} style={{
              background: i === 1 ? T.acc : T.bg2,
              border: i === 1 ? "none" : `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 9, padding: "8px 16px", fontSize: 12,
              fontFamily: T.ff, fontWeight: 600, cursor: "pointer",
              color: i === 1 ? "#000" : T.txt2, transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard icon="⚡" label="CPU Usage" value={metrics.cpu} unit="%" trend="up" trendVal="+2.1%" color="cyan">
          <MiniBar value={metrics.cpu} color={T.acc} />
        </StatCard>
        <StatCard icon="🧠" label="RAM Usage" value={metrics.ram} unit="%" trend="down" trendVal="-1.4%" color="purple">
          <MiniBar value={metrics.ram} color={T.acc2} />
        </StatCard>
        <StatCard icon="💾" label="Disk Usage" value={metrics.disk} unit="%" color="green">
          <MiniBar value={metrics.disk} color={T.acc3} />
        </StatCard>
        <StatCard icon="🔗" label="Network ↓↑" value={`${metrics.net_down}`} unit="MB/s" color="amber">
          <MiniBar value={(metrics.net_down / 100) * 100} color={T.acc4} />
        </StatCard>
      </div>

      {/* Mid grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        {/* CPU Chart */}
        <Card>
          <CardHeader title="CPU Activity (60s)" action="Details →" />
          <Sparkline data={metrics.history} color={T.acc} height={72} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
            {[
              { label: "CPU", val: `${metrics.cpu}%`, color: T.acc },
              { label: "RAM", val: `${metrics.ram}%`, color: T.acc2 },
              { label: "Swap", val: `${metrics.swap}%`, color: T.accP },
              { label: "I/O Wait", val: `${metrics.io}%`, color: T.acc4 },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: T.bg2, borderRadius: 9, padding: "8px 10px",
                borderLeft: `2px solid ${color}`,
              }}>
                <div style={{ fontSize: 10, color: T.txt2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.mono, color }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resource bars */}
        <Card>
          <CardHeader title="Resource Utilization" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { name: "CPU Cores", val: metrics.cpu, color: T.acc },
              { name: "Memory", val: metrics.ram, color: T.acc2 },
              { name: "Disk I/O", val: metrics.io, color: T.acc3 },
              { name: "GPU", val: metrics.gpu, color: T.accP },
              { name: "Swap", val: metrics.swap, color: T.acc4 },
            ].map(({ name, val, color }) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "80px 1fr 42px", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 11, color: T.txt2 }}>{name}</div>
                <MiniBar value={val} color={color} />
                <div style={{ fontSize: 11, fontFamily: T.mono, textAlign: "right", color: T.txt }}>{val}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Services + Processes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Services */}
        <Card>
          <CardHeader title="Services" action="Manage →" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </Card>

        {/* Processes */}
        <Card>
          <CardHeader title="Top Processes" action="Kill →" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, paddingBottom: 6, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              {["Process", "CPU", "MEM", ""].map(h => (
                <div key={h} style={{ fontSize: 10, color: T.txt3, letterSpacing: 1, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {PROCESSES.map(p => (
              <div key={p.name} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto 60px",
                gap: 8, alignItems: "center", padding: "7px 8px",
                background: T.bg2, borderRadius: 8, transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                onMouseLeave={e => e.currentTarget.style.background = T.bg2}
              >
                <div style={{ fontFamily: T.mono, fontSize: 12 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.txt2, fontFamily: T.mono }}>{p.cpu}%</div>
                <div style={{ fontSize: 11, color: T.txt2, fontFamily: T.mono }}>{p.mem}</div>
                <MiniBar value={p.cpu * 8} color={p.color} height={4} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Network + Uptime */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <CardHeader title="Network Interfaces" action="Configure →" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Interface", "IP Address", "Down", "Up"].map(h => (
                <th key={h} style={{ fontSize: 10, color: T.txt3, letterSpacing: 1, textTransform: "uppercase", padding: "0 0 10px", textAlign: "left", fontWeight: 600 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[
                { iface: "eth0", ip: "192.168.1.50", down: `↓ ${metrics.net_down} MB/s`, up: `↑ ${metrics.net_up} MB/s` },
                { iface: "wg0", ip: "10.8.0.1", down: "↓ 1.1 MB/s", up: "↑ 0.4 MB/s" },
                { iface: "lo", ip: "127.0.0.1", down: "↓ 0.0", up: "↑ 0.0" },
              ].map(row => (
                <tr key={row.iface}>
                  <td style={{ padding: "8px 0", borderTop: `1px solid rgba(255,255,255,0.04)`, fontFamily: T.mono, fontWeight: 500 }}>{row.iface}</td>
                  <td style={{ padding: "8px 0", borderTop: `1px solid rgba(255,255,255,0.04)`, fontFamily: T.mono, fontSize: 11, color: T.txt2 }}>{row.ip}</td>
                  <td style={{ padding: "8px 0", borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${T.accR}12`, color: T.accR, fontFamily: T.mono }}>{row.down}</span>
                  </td>
                  <td style={{ padding: "8px 0", borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${T.acc3}12`, color: T.acc3, fontFamily: T.mono }}>{row.up}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Service Uptime (90 days)" />
          <UptimeGraph />
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 10, color: T.txt2 }}>
            {[["Online", T.acc3], ["Maintenance", T.bg4], ["Downtime", T.accR]].map(([label, color]) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: "inline-block" }} />
                {label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader title="System Event Log" action="View all →" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EVENTS.map((e, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "10px 12px",
              background: T.bg2, borderRadius: 9,
              borderLeft: `3px solid ${EVENT_COLORS[e.type]}`,
            }}>
              <span style={{ color: EVENT_COLORS[e.type], fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{e.icon}</span>
              <div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>{e.msg}</div>
                <div style={{ fontSize: 10, color: T.txt3, marginTop: 3, fontFamily: T.mono }}>{e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const metrics = useMetrics();
  const time = useClock();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg0}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bg0}; }
        ::-webkit-scrollbar-thumb { background: ${T.bg3}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.bg4}; }
        input::placeholder { color: ${T.txt3}; }
      `}</style>
      <div style={css.root}>
        <Topbar time={time} />
        <Sidebar />
        <Dashboard metrics={metrics} />
      </div>
    </>
  );
}
