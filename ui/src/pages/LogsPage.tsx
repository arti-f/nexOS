import { useState } from 'react';
import { T, LOG_PRIORITY_COLOR, LOG_PRIORITY_LABEL } from '@/utils/tokens';
import { Card, CardHeader } from '@/components/ui/Card';
import { useSystemLogs } from '@/api/queries';
import { format } from 'date-fns';

const PRIORITY_FILTERS = [
  { label: 'All',   value: undefined },
  { label: 'Error', value: 3 },
  { label: 'Warn',  value: 4 },
  { label: 'Info',  value: 6 },
];

export function LogsPage() {
  const [priority, setPriority] = useState<number | undefined>(undefined);
  const [lines, setLines] = useState(100);
  const { data, isLoading, refetch } = useSystemLogs({ lines, priority });

  const logs = data?.logs ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>System Logs</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>{logs.length} entries · auto-refreshes every 10s</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {PRIORITY_FILTERS.map(f => (
            <button key={String(f.value)} onClick={() => setPriority(f.value)} style={{
              background: priority === f.value ? T.acc : T.bg2,
              border: `1px solid ${priority === f.value ? T.acc : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, padding: '6px 14px', fontSize: 11,
              color: priority === f.value ? '#000' : T.txt2,
              cursor: 'pointer', fontFamily: T.ff, fontWeight: 600,
            }}>{f.label}</button>
          ))}
          <button onClick={() => refetch()} style={{
            background: T.bg2, border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 8, padding: '6px 12px', fontSize: 11,
            color: T.txt2, cursor: 'pointer',
          }}>↺ Refresh</button>
        </div>
      </div>

      <Card>
        <CardHeader title="Journal Log" />
        <div style={{
          background: T.bg0, borderRadius: 10, padding: 12,
          maxHeight: 600, overflowY: 'auto',
          fontFamily: T.mono, fontSize: 11, lineHeight: 1.7,
        }}>
          {isLoading && <div style={{ color: T.txt2 }}>Loading logs...</div>}
          {logs.length === 0 && !isLoading && (
            <div style={{ color: T.txt2 }}>No log entries found. Is the API running?</div>
          )}
          {logs.map((entry, i) => {
            const c = LOG_PRIORITY_COLOR[entry.priority] ?? T.txt2;
            const lbl = LOG_PRIORITY_LABEL[entry.priority] ?? '?';
            const ts = entry.timestamp
              ? format(new Date(entry.timestamp), 'HH:mm:ss')
              : '—';
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '55px 40px 120px 1fr',
                gap: 10, padding: '2px 0',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}>
                <span style={{ color: T.txt3 }}>{ts}</span>
                <span style={{ color: c, fontWeight: 600 }}>{lbl}</span>
                <span style={{ color: T.acc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.unit}</span>
                <span style={{ color: T.txt }}>{entry.message}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
