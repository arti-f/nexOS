import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_METRICS_URL } from '@/api/client';
import type { MetricsFrame } from '@/types';

const HISTORY_LEN = 60;

export interface LiveMetrics {
  frame: MetricsFrame | null;
  history: number[];          // last 60 cpu usage values
  connected: boolean;
}

export function useLiveMetrics(): LiveMetrics {
  const [frame, setFrame] = useState<MetricsFrame | null>(null);
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: HISTORY_LEN }, () => 20 + Math.random() * 30)
  );
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_METRICS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e: MessageEvent<string>) => {
      try {
        const f = JSON.parse(e.data) as MetricsFrame;
        setFrame(f);
        setHistory(prev => [...prev.slice(1), f.cpu.usage]);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3s
      retryRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { frame, history, connected };
}
