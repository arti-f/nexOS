import { T, fmtMB } from '@/utils/tokens';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { useSystemSnapshot } from '@/api/queries';
import { Sparkline } from '@/components/charts/Sparkline';
import { MiniBar } from '@/components/ui/MiniBar';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { UptimeGraph } from '@/components/ui/UptimeGraph';
import type { ServiceCardData } from '@/components/ui/ServiceCard';

const SERVICES: ServiceCardData[] = [
  { icon: '🐘', name: 'PostgreSQL', sub: 'Port 5432 · v16.2', status: 'online',  uptime: '↑ 14d 06h' },
  { icon: '🔴', name: 'Redis',      sub: 'Port 6379 · v7.2',  status: 'online',  uptime: '↑ 14d 06h' },
  { icon: '🐳', name: 'Portainer',  sub: 'Port 9443 · v2.21', status: 'online',  uptime: '↑ 8d 14h'  },
  { icon: '📊', name: 'Grafana',    sub: 'Port 3000 · v10.4', status: 'warning', uptime: '↑ 3d 02h'  },
  { icon: '🔀', name: 'Nginx Proxy',sub: 'Port 443 · v1.26',  status: 'online',  uptime: '↑ 14d 06h' },
  { icon: '🌐', name: 'WireGuard',  sub: 'Port 51820 · VPN',  status: 'online',  uptime: '↑ 14d 06h' },
];

interface EventData {
  type: 'ok' | 'warn' | 'info' | 'err';
  icon: string;
  msg: string;
  time: string;
}

const EVENTS: EventData[] = [
  { type: 'ok',   icon: '✓', msg: 'Container nginx-proxy restarted successfully',          time: '2m ago · system.daemon'  },
  { type: 'warn', icon: '⚠', msg: 'High memory on grafana — 94% of limit',                time: '18m ago · docker.monitor' },
  { type: 'info', icon: 'ℹ', msg: 'SSL cert for nexos.local renewed. Expires in 89 days', time: '2h ago · certbot'         },
  { type: 'err',  icon: '✕', msg: 'Failed login from 103.45.67.89 — blocked by firewall', time: '4h ago · security.fw'     },
  { type: 'ok',   icon: '↓', msg: 'Kernel updated: 6.6.31 → 6.6.33',                     time: 'Yesterday · pacman'       },
];

const EVENT_COLOR: Record<EventData['type'], string> = {
  ok: T.acc3, warn: T.acc4, info: T.acc, err: T.accR,
};

export function OverviewPage() {
  const { frame, history } = useLiveMetrics();
  const { data: system } = useSystemSnapshot();

  // Merge live WebSocket data with REST snapshot
  const cpu    = frame?.cpu.usage   ?? system?.cpu.usage  ?? 0;
  const ram    = frame?.ram.percent ?? system?.memory.ram.percent ?? 0;
  const ramUsed= frame?.ram.used    ?? system?.memory.ram.used ?? 0;
  const ramTot = frame?.ram.total   ?? system?.memory.ram.total ?? 0;
  const swap   = frame?.swap.percent ?? system?.memory.swap.percent ?? 0;
  const disk   = system?.disk[0]?.percent ?? 43;
  const iowait = frame?.cpu.iowait ?? 0;
  const netDown= frame?.net[0]?.rx_speed_mb ?? '0.00';
  const netUp  = frame?.net[0]?.tx_speed_mb ?? '0.00';
  const uptime = system?.uptime.human ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>System Overview</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>
            Last updated: just now · Uptime: {uptime}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Export', 'Schedule'].map((l, i) => (
            <button key={l} style={{
              background: i === 1 ? T.acc : T.bg2,
              border: i === 1 ? 'none' : `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 9, padding: '8px 16px', fontSize: 12,
              fontFamily: T.ff, fontWeight: 600, cursor: 'pointer',
              color: i === 1 ? '#000' : T.txt2, transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard icon="⚡" label="CPU Usage"   value={cpu}  unit="%" trend="up"   trendVal="+2.1%" color="cyan">
          <MiniBar value={cpu} color={T.acc} />
        </StatCard>
        <StatCard icon="🧠" label="RAM Usage"   value={ram}  unit="%" trend="down" trendVal="-1.4%" color="purple">
          <MiniBar value={ram} color={T.acc2} />
        </StatCard>
        <StatCard icon="💾" label="Disk Usage"  value={disk} unit="%"                               color="green">
          <MiniBar value={disk} color={T.acc3} />
        </StatCard>
        <StatCard icon="🔗" label="Network ↓↑"  value={netDown} unit="MB/s"                        color="amber">
          <MiniBar value={parseFloat(netDown)} color={T.acc4} />
        </StatCard>
      </div>

      {/* CPU Chart + Resource Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
        <Card>
          <CardHeader title="CPU Activity (60s)" action="Details →" />
          <Sparkline data={history} color={T.acc} height={72} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
            {[
              { label: 'CPU',     val: `${cpu}%`,    color: T.acc  },
              { label: 'RAM',     val: `${ram}%`,    color: T.acc2 },
              { label: 'Swap',    val: `${swap}%`,   color: T.accP },
              { label: 'I/O Wait',val: `${iowait}%`, color: T.acc4 },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: T.bg2, borderRadius: 9, padding: '8px 10px',
                borderLeft: `2px solid ${color}`,
              }}>
                <div style={{ fontSize: 10, color: T.txt2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.mono, color }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Resource Utilization" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'CPU Cores', val: cpu,   color: T.acc  },
              { name: 'Memory',    val: ram,   color: T.acc2 },
              { name: 'Disk I/O',  val: iowait,color: T.acc3 },
              { name: 'Swap',      val: swap,  color: T.acc4 },
              { name: 'Disk',      val: disk,  color: T.accP },
            ].map(({ name, val, color }) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 42px', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 11, color: T.txt2 }}>{name}</div>
                <MiniBar value={val} color={color} />
                <div style={{ fontSize: 11, fontFamily: T.mono, textAlign: 'right', color: T.txt }}>{val}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Services + Processes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <CardHeader title="Services" action="Manage →" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SERVICES.map(s => <ServiceCard key={s.name} {...s} />)}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Processes" action="Kill →" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, paddingBottom: 6, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              {['Process', 'CPU', 'MEM', ''].map(h => (
                <div key={h} style={{ fontSize: 10, color: T.txt3, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {[
              { name: 'postgres',     cpu: 8.2, mem: '412M', color: T.acc  },
              { name: 'docker-proxy', cpu: 5.6, mem: '280M', color: T.acc2 },
              { name: 'grafana',      cpu: 4.1, mem: '310M', color: T.acc3 },
              { name: 'nginx',        cpu: 2.0, mem: '48M',  color: T.acc4 },
              { name: 'sshd',         cpu: 0.8, mem: '12M',  color: T.accR },
            ].map(p => (
              <div key={p.name} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto 60px',
                gap: 8, alignItems: 'center', padding: '7px 8px',
                background: T.bg2, borderRadius: 8, transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bg3}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = T.bg2}
              >
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.txt }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.txt2, fontFamily: T.mono }}>{p.cpu}%</div>
                <div style={{ fontSize: 11, color: T.txt2, fontFamily: T.mono }}>{p.mem}</div>
                <MiniBar value={p.cpu * 8} color={p.color} height={4} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Network + Uptime */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <CardHeader title="Network Interfaces" action="Configure →" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Interface', 'IP Address', 'Down', 'Up'].map(h => (
                <th key={h} style={{ fontSize: 10, color: T.txt3, letterSpacing: 1, textTransform: 'uppercase', padding: '0 0 10px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[
                { iface: 'eth0', ip: '192.168.1.50', down: `↓ ${netDown} MB/s`, up: `↑ ${netUp} MB/s` },
                { iface: 'wg0',  ip: '10.8.0.1',     down: '↓ 1.1 MB/s',        up: '↑ 0.4 MB/s'      },
                { iface: 'lo',   ip: '127.0.0.1',     down: '↓ 0.0',             up: '↑ 0.0'            },
              ].map(row => (
                <tr key={row.iface}>
                  <td style={{ padding: '8px 0', borderTop: `1px solid rgba(255,255,255,0.04)`, fontFamily: T.mono, fontWeight: 500, color: T.txt }}>{row.iface}</td>
                  <td style={{ padding: '8px 0', borderTop: `1px solid rgba(255,255,255,0.04)`, fontFamily: T.mono, fontSize: 11, color: T.txt2 }}>{row.ip}</td>
                  <td style={{ padding: '8px 0', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${T.accR}12`, color: T.accR, fontFamily: T.mono }}>{row.down}</span>
                  </td>
                  <td style={{ padding: '8px 0', borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${T.acc3}12`, color: T.acc3, fontFamily: T.mono }}>{row.up}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Service Uptime (90 days)" />
          <UptimeGraph />
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 10, color: T.txt2 }}>
            {([['Online', T.acc3], ['Maintenance', T.bg4], ['Downtime', T.accR]] as [string, string][]).map(([label, color]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Memory detail when system data available */}
      {system && (
        <Card>
          <CardHeader title="Memory Detail" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Used',      val: fmtMB(ramUsed),                        color: T.acc2 },
              { label: 'Available', val: fmtMB(system.memory.ram.available),    color: T.acc3 },
              { label: 'Cached',    val: fmtMB(system.memory.ram.cached),       color: T.acc  },
              { label: 'Buffers',   val: fmtMB(system.memory.ram.buffers),      color: T.acc4 },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: T.bg2, borderRadius: 9, padding: '10px 12px', borderLeft: `2px solid ${color}` }}>
                <div style={{ fontSize: 10, color: T.txt2, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color }}>{val}</div>
                <div style={{ fontSize: 10, color: T.txt3, marginTop: 2 }}>of {fmtMB(ramTot)} total</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event Log */}
      <Card>
        <CardHeader title="System Event Log" action="View all →" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EVENTS.map((e, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '10px 12px',
              background: T.bg2, borderRadius: 9,
              borderLeft: `3px solid ${EVENT_COLOR[e.type]}`,
            }}>
              <span style={{ color: EVENT_COLOR[e.type], fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{e.icon}</span>
              <div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: T.txt }}>{e.msg}</div>
                <div style={{ fontSize: 10, color: T.txt3, marginTop: 3, fontFamily: T.mono }}>{e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
