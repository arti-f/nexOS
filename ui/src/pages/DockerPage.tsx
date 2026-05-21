import { T } from '@/utils/tokens';
import { Card, CardHeader } from '@/components/ui/Card';
import { MiniBar } from '@/components/ui/MiniBar';
import { useDockerSnapshot, useContainerAction } from '@/api/queries';
import type { Container, ContainerState } from '@/types';

const STATE_COLOR: Record<ContainerState, string> = {
  running:    T.acc3,
  exited:     T.txt3,
  paused:     T.acc4,
  restarting: T.acc,
  dead:       T.accR,
  created:    T.acc2,
};

function ContainerRow({ container }: { container: Container }) {
  const { start, stop, restart } = useContainerAction();
  const sc = STATE_COLOR[container.state] ?? T.txt3;
  const isRunning = container.state === 'running';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '8px 180px 1fr 90px 100px 160px',
      gap: 12, alignItems: 'center',
      padding: '10px 12px', background: T.bg2, borderRadius: 10,
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bg3}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = T.bg2}
    >
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: isRunning ? `0 0 6px ${sc}` : 'none' }} />

      {/* Name */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{container.name}</div>
        <div style={{ fontSize: 10, color: T.txt3, fontFamily: T.mono }}>{container.id}</div>
      </div>

      {/* Image */}
      <div style={{ fontSize: 11, color: T.txt2, fontFamily: T.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {container.image}
      </div>

      {/* State */}
      <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${sc}18`, color: sc, fontFamily: T.mono, textAlign: 'center' }}>
        {container.state}
      </div>

      {/* Ports */}
      <div style={{ fontSize: 10, color: T.txt2, fontFamily: T.mono }}>
        {container.ports.filter(p => p.public).slice(0, 2).map(p => `${p.public}:${p.private}`).join(', ') || '—'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        {isRunning ? (
          <>
            <ActionBtn label="■ Stop"    color={T.accR} onClick={() => stop.mutate(container.id_full)} />
            <ActionBtn label="↺ Restart" color={T.acc4} onClick={() => restart.mutate(container.id_full)} />
          </>
        ) : (
          <ActionBtn label="▶ Start" color={T.acc3} onClick={() => start.mutate(container.id_full)} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}15`, border: `1px solid ${color}30`,
      borderRadius: 7, padding: '4px 9px', fontSize: 10,
      color, cursor: 'pointer', fontFamily: T.ff, fontWeight: 600,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = `${color}28`}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = `${color}15`}
    >{label}</button>
  );
}

export function DockerPage() {
  const { data, isLoading, error } = useDockerSnapshot();

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState msg="Cannot connect to Docker API. Is nexos-api running?" />;
  if (!data)     return null;

  const { info, containers } = data;
  const running = containers.filter(c => c.state === 'running').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>Docker</div>
        <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>Engine v{info.version} · {info.cpus} CPUs · {info.os}</div>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total Containers', val: info.containers, color: T.acc  },
          { label: 'Running',          val: info.running,    color: T.acc3 },
          { label: 'Stopped',          val: info.stopped,    color: T.txt3 },
          { label: 'Images',           val: info.images,     color: T.acc2 },
        ].map(({ label, val, color }) => (
          <Card key={label}>
            <div style={{ fontSize: 10, color: T.txt2, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: T.mono }}>{val}</div>
          </Card>
        ))}
      </div>

      {/* Container running bar */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: T.txt2 }}>Running containers</span>
          <span style={{ fontSize: 12, fontFamily: T.mono, color: T.acc3 }}>{running} / {info.containers}</span>
        </div>
        <MiniBar value={(running / Math.max(1, info.containers)) * 100} color={T.acc3} height={6} />
      </Card>

      {/* Container list */}
      <Card>
        <CardHeader title={`Containers (${containers.length})`} action="Pull image →" />

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '8px 180px 1fr 90px 100px 160px',
          gap: 12, padding: '0 12px 10px',
          borderBottom: `1px solid rgba(255,255,255,0.05)`,
        }}>
          {['', 'Name', 'Image', 'State', 'Ports', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 10, color: T.txt3, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {containers.length === 0
            ? <div style={{ color: T.txt2, fontSize: 13, padding: 12 }}>No containers found.</div>
            : containers.map(c => <ContainerRow key={c.id} container={c} />)
          }
        </div>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: T.txt2, fontSize: 14 }}>
      Loading Docker data...
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div style={{
      background: `${T.accR}10`, border: `1px solid ${T.accR}30`,
      borderRadius: 12, padding: 24, color: T.accR, fontSize: 13,
    }}>⚠ {msg}</div>
  );
}
