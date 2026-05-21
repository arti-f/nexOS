import { CSSProperties, ReactNode } from 'react';
import { T } from '@/utils/tokens';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ children, style = {} }: CardProps) {
  return (
    <div style={{
      background: T.bg1,
      border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: 14,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function CardHeader({ title, action, onAction }: CardHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{title}</div>
      {action && (
        <span
          onClick={onAction}
          style={{ fontSize: 11, color: T.acc, cursor: 'pointer', fontWeight: 600 }}
        >
          {action}
        </span>
      )}
    </div>
  );
}
