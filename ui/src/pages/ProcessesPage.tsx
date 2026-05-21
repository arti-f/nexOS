import { T } from '@/utils/tokens';
import { Card, CardHeader } from '@/components/ui/Card';
import { MiniBar } from '@/components/ui/MiniBar';
import { useProcesses, useKillProcess } from '@/api/queries';

const STATE_LABEL: Record<string, string> = {
  R: 'Running', S: 'Sleeping', D: 'I/O Wait',
  Z: 'Zombie',  T: 'Stopped',  I: 'Idle',
};

export function ProcessesPage() {
  const { data, isLoading } = useProcesses(25);
  const kill = useKillProcess();

  const procs = data?.processes ?? [];
  const summary = data?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>Processes</div>
        {summary && (
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>
            {summary.total} total processes
          </div>
        )}
      </div>

      <Card>
        <CardHeader title="Top Processes by CPU" />

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 70px 80px 80px 60px 100px',
          gap: 10, padding: '0 10px 10px',
          borderBottom: `1px solid rgba(255,255,255,0.05)`,
        }}>
          {['PID', 'Name', 'State', 'CPU %', 'Memory', 'vMem', 'CPU Bar'].map(h => (
            <div key={h} style={{ fontSize: 10, color: T.txt3, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {isLoading && (
            <div style={{ color: T.txt2, fontSize: 13, padding: 12, textAlign: 'center' }}>Loading...</div>
          )}
          {procs.map((p, idx) => {
            const rowColor = idx % 2 === 0 ? T.bg2 : 'transparent';
            const cpuColor = p.cpu_percent > 50 ? T.accR : p.cpu_percent > 20 ? T.acc4 : T.acc;
            return (
              <div key={p.pid} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 70px 80px 80px 60px 100px',
                gap: 10, alignItems: 'center',
                padding: '8px 10px', borderRadius: 8,
                background: rowColor, transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bg3}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = rowColor}
              >
                <div style={{ fontSize: 11, color: T.txt3, fontFamily: T.mono }}>{p.pid}</div>
                <div style={{ fontSize: 12, fontFamily: T.mono, color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.txt2 }}>{STATE_LABEL[p.state] ?? p.state}</div>
                <div style={{ fontSize: 12, fontFamily: T.mono, color: cpuColor, fontWeight: 600 }}>{p.cpu_percent.toFixed(1)}%</div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.txt2 }}>{p.mem_mb} MB</div>
                <div style={{ fontSize: 11, fontFamily: T.mono, color: T.txt3 }}>{p.vsize_mb} MB</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <MiniBar value={Math.min(100, p.cpu_percent * 4)} color={cpuColor} height={4} />
                  </div>
                  <button
                    onClick={() => kill.mutate({ pid: p.pid })}
                    style={{
                      background: `${T.accR}15`, border: `1px solid ${T.accR}30`,
                      borderRadius: 5, padding: '2px 6px', fontSize: 9,
                      color: T.accR, cursor: 'pointer', fontFamily: T.ff,
                    }}
                    title={`Kill PID ${p.pid}`}
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
