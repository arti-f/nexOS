import { ReactNode } from 'react';
import { T, ACCENT_MAP } from '@/utils/tokens';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down';
  trendVal?: string;
  color?: keyof typeof ACCENT_MAP;
  children?: ReactNode;
}

export function StatCard({ icon, label, value, unit, trend, trendVal, color = 'cyan', children }: StatCardProps) {
  const c = ACCENT_MAP[color] ?? T.acc;
  return (
    <div
      style={{
        background: T.bg1,
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 14,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${c}30`;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLDivElement).style.transform = '';
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c, opacity: 0.8 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${c}15`, color: c, fontSize: 17,
        }}>{icon}</div>
        {trendVal && (
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            fontFamily: T.mono,
            background: trend === 'up' ? `${T.acc3}18` : `${T.accR}18`,
            color: trend === 'up' ? T.acc3 : T.accR,
          }}>
            {trend === 'up' ? '▲' : '▼'} {trendVal}
          </span>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, color: T.txt }}>
        {value}
        <span style={{ fontSize: 14, color: T.txt2, fontWeight: 500, marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: T.txt2, marginTop: 4 }}>{label}</div>
      {children && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}
