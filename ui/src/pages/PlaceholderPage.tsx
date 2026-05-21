import { T } from '@/utils/tokens';
import { Card } from '@/components/ui/Card';

interface PlaceholderPageProps {
  title: string;
  icon: string;
  description: string;
}

export function PlaceholderPage({ title, icon, description }: PlaceholderPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>{title}</div>
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>{description}</div>
        <div style={{
          marginTop: 20, display: 'inline-block',
          fontSize: 10, padding: '4px 12px', borderRadius: 20,
          background: `${T.acc}15`, color: T.acc, fontFamily: T.mono,
        }}>Coming soon — Fase 3</div>
      </Card>
    </div>
  );
}
