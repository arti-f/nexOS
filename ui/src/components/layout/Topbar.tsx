import { T } from '@/utils/tokens';
import { useClock } from '@/hooks/useClock';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';

export function Topbar() {
  const time = useClock();
  const { connected } = useLiveMetrics();
  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div style={{
      gridColumn: '1/-1',
      background: T.bg1,
      borderBottom: `1px solid rgba(255,255,255,0.06)`,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      position: 'sticky', top: 0, zIndex: 200,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 220, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${T.acc2}, ${T.acc})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#000',
        }}>N</div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5, color: T.txt }}>
          Nex<span style={{ color: T.acc }}>OS</span>
        </span>
        <span style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 6,
          background: `${T.acc2}25`, color: T.acc2, fontFamily: T.mono, marginLeft: 2,
        }}>v1.0.0</span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: T.bg2, border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 9, padding: '6px 12px', display: 'flex', alignItems: 'center',
          gap: 8, width: 280, color: T.txt3,
        }}>
          <span style={{ fontSize: 14 }}>⌕</span>
          <input
            placeholder="Search apps, files, settings..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: T.txt, fontFamily: T.ff, fontSize: 12, flex: 1,
            }}
          />
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.txt3 }}>⌘K</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.txt2, fontSize: 12 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? T.acc3 : T.acc4,
            display: 'inline-block',
            boxShadow: `0 0 6px ${connected ? T.acc3 : T.acc4}`,
          }} />
          <span>{connected ? 'Live' : 'Polling'}</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />

        {(['🔔', '🌙', '⚙'] as const).map((ic, i) => (
          <button key={i} style={{
            background: T.bg2, border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 8, padding: '5px 9px', color: T.txt2, cursor: 'pointer',
            fontSize: 14, transition: 'all 0.15s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = T.acc;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${T.acc}30`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = T.txt2;
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >{ic}</button>
        ))}

        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.txt2, letterSpacing: 0.5 }}>{timeStr}</div>

        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `linear-gradient(135deg, ${T.acc2}, ${T.acc})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#000',
        }}>A</div>
      </div>
    </div>
  );
}
