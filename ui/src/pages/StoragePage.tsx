import { T, fmtMB } from '@/utils/tokens';
import { Card, CardHeader } from '@/components/ui/Card';
import { MiniBar } from '@/components/ui/MiniBar';
import { useSystemSnapshot } from '@/api/queries';

export function StoragePage() {
  const { data } = useSystemSnapshot();
  const partitions = data?.disk ?? [];
  const io = data?.disk_io;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>Storage</div>
        <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>{partitions.length} partitions detected</div>
      </div>

      {/* I/O Stats */}
      {io && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Disk Read',  val: `${io.read_kbs} KB/s`,  color: T.acc },
            { label: 'Disk Write', val: `${io.write_kbs} KB/s`, color: T.acc4 },
          ].map(({ label, val, color }) => (
            <Card key={label}>
              <div style={{ fontSize: 10, color: T.txt2, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: T.mono, color }}>{val}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Partition list */}
      <Card>
        <CardHeader title="Disk Partitions" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {partitions.length === 0 && (
            <div style={{ color: T.txt2, fontSize: 13 }}>No data — is the API running?</div>
          )}
          {partitions.map(p => {
            const color = p.percent > 90 ? T.accR : p.percent > 70 ? T.acc4 : T.acc3;
            return (
              <div key={p.mount}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.txt, fontFamily: T.mono }}>{p.mount}</span>
                    <span style={{ fontSize: 10, color: T.txt3, marginLeft: 10 }}>{p.device} · {p.fstype}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontFamily: T.mono, color }}>{p.percent}%</span>
                    <span style={{ fontSize: 10, color: T.txt2, marginLeft: 8 }}>
                      {fmtMB(p.used)} / {fmtMB(p.size)}
                    </span>
                  </div>
                </div>
                <MiniBar value={p.percent} color={color} height={6} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
