import { T } from '@/utils/tokens';

export type ServiceStatus = 'online' | 'warning' | 'offline';

export interface ServiceCardData {
  icon: string;
  name: string;
  sub: string;
  status: ServiceStatus;
  uptime?: string;
}

export function ServiceCard({ icon, name, sub, status, uptime }: ServiceCardData) {
  const sColor: Record<ServiceStatus, string> = {
    online:  T.acc3,
    warning: T.acc4,
    offline: T.accR,
  };
  const c = sColor[status];

  return (
    <div
      style={{
        background: T.bg2,
        border: `1px solid rgba(255,255,255,0.05)`,
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
        transition: 'all 0.18s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.11)';
        el.style.background = T.bg3;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.05)';
        el.style.background = T.bg2;
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, background: T.bg3, flexShrink: 0,
      }}>{icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: T.txt }}>{name}</div>
        <div style={{ fontSize: 10, color: T.txt2 }}>{sub}</div>
        {uptime && <div style={{ fontSize: 10, color: T.txt3, marginTop: 4, fontFamily: T.mono }}>{uptime}</div>}
      </div>

      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: c, flexShrink: 0, marginTop: 4,
        boxShadow: status === 'online' ? `0 0 7px ${c}` : 'none',
      }} />
    </div>
  );
}
