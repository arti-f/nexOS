import { T } from '@/utils/tokens';

interface MiniBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function MiniBar({ value, color = T.acc, height = 5 }: MiniBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ background: T.bg3, borderRadius: 3, height, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', borderRadius: 3, background: color,
        width: `${pct}%`,
        transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
        boxShadow: `0 0 6px ${color}60`,
      }} />
    </div>
  );
}
