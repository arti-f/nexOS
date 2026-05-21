import { T } from '@/utils/tokens';
import { Card, CardHeader } from '@/components/ui/Card';
import { MiniBar } from '@/components/ui/MiniBar';
import { useNetworkSnapshot } from '@/api/queries';

export function NetworkPage() {
  const { data, isLoading } = useNetworkSnapshot();

  const interfaces = data?.interfaces ?? [];
  const connections = data?.connections.tcp_connections ?? 0;
  const dns = data?.dns.nameservers ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>Network</div>
        <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>
          {connections} TCP connections · {interfaces.length} interfaces
        </div>
      </div>

      {/* Interface cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 12 }}>
        {isLoading ? (
          <Card><div style={{ color: T.txt2 }}>Loading...</div></Card>
        ) : interfaces.map(iface => {
          const rxMb = parseFloat(iface.rx_speed_mb);
          const txMb = parseFloat(iface.tx_speed_mb);
          const ip   = iface.addresses?.find(a => a.family === 'inet')?.address ?? '—';
          const state = iface.state ?? 'unknown';
          const isUp = state === 'UP';

          return (
            <Card key={iface.interface}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.mono, color: T.txt }}>{iface.interface}</div>
                  <div style={{ fontSize: 11, color: T.txt2, marginTop: 2 }}>{ip}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20,
                  background: isUp ? `${T.acc3}18` : `${T.txt3}18`,
                  color: isUp ? T.acc3 : T.txt3,
                }}>{state}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.accR }}>↓ Download</span>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: T.accR }}>{iface.rx_speed_mb} MB/s</span>
                  </div>
                  <MiniBar value={Math.min(100, rxMb * 10)} color={T.accR} height={4} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.acc3 }}>↑ Upload</span>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: T.acc3 }}>{iface.tx_speed_mb} MB/s</span>
                  </div>
                  <MiniBar value={Math.min(100, txMb * 10)} color={T.acc3} height={4} />
                </div>
              </div>

              {iface.mac && (
                <div style={{ marginTop: 10, fontSize: 10, color: T.txt3, fontFamily: T.mono }}>
                  MAC: {iface.mac}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* DNS + Connections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <CardHeader title="DNS Servers" />
          {dns.length === 0
            ? <div style={{ color: T.txt2, fontSize: 12 }}>No DNS servers found</div>
            : dns.map(ns => (
              <div key={ns} style={{
                padding: '8px 10px', background: T.bg2, borderRadius: 8,
                marginBottom: 6, fontFamily: T.mono, fontSize: 12, color: T.acc,
              }}>{ns}</div>
            ))
          }
        </Card>

        <Card>
          <CardHeader title="Connections" />
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: T.mono, color: T.acc, lineHeight: 1 }}>{connections}</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 6 }}>Active TCP connections</div>
        </Card>
      </div>
    </div>
  );
}
