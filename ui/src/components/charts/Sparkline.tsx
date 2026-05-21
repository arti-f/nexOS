import { useEffect, useRef } from 'react';
import { T } from '@/utils/tokens';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = T.acc, height = 64 }: SparklineProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth || 400;
    const H = height;
    canvas.width = W;
    canvas.height = H;

    const max = Math.max(...data, 1);
    const step = W / (data.length - 1);

    ctx.clearRect(0, 0, W, H);

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = H - (v / max) * H * 0.88 - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill gradient
    const lastX = (data.length - 1) * step;
    const lastY = H - (data[data.length - 1] / max) * H * 0.88 - 2;
    ctx.lineTo(lastX, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = `${color}18`;
    ctx.fill();
  }, [data, color, height]);

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height, display: 'block' }}
    />
  );
}
