import { useRef } from 'react';
import { T } from '@/utils/tokens';

interface UptimeGraphProps { days?: number }

type DayStatus = 'online' | 'maint' | 'down';

const COLOR: Record<DayStatus, string> = {
  online: T.acc3,
  maint:  T.bg4,
  down:   T.accR,
};

export function UptimeGraph({ days = 90 }: UptimeGraphProps) {
  const boxes = useRef<DayStatus[]>(
    Array.from({ length: days }, () => {
      const r = Math.random();
      return r > 0.04 ? 'online' : r > 0.015 ? 'maint' : 'down';
    })
  ).current;

  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {boxes.map((s, i) => (
        <div
          key={i}
          title={`Day ${days - i}: ${s}`}
          style={{
            width: 7, height: 14, borderRadius: 2,
            background: COLOR[s],
            opacity: s === 'maint' ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
