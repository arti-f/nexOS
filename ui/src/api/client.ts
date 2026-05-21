// ─── API CLIENT ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const WS_BASE = BASE.replace(/^http/, 'ws');

export const API_BASE = BASE;
export const WS_METRICS_URL = `${WS_BASE}/api/v1/stream/metrics`;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── SYSTEM ──────────────────────────────────────────────────────────────────
export const api = {
  system: {
    snapshot: () => apiFetch<import('@/types').SystemSnapshot>('/api/v1/system'),
    cpu:      () => apiFetch('/api/v1/system/cpu'),
    memory:   () => apiFetch('/api/v1/system/memory'),
    disk:     () => apiFetch('/api/v1/system/disk'),
    uptime:   () => apiFetch('/api/v1/system/uptime'),
    host:     () => apiFetch('/api/v1/system/host'),
  },

  network: {
    snapshot:    () => apiFetch<import('@/types').NetworkSnapshot>('/api/v1/network'),
    stats:       () => apiFetch('/api/v1/network/stats'),
    interfaces:  () => apiFetch('/api/v1/network/interfaces'),
    connections: () => apiFetch('/api/v1/network/connections'),
    dns:         () => apiFetch('/api/v1/network/dns'),
  },

  docker: {
    snapshot:  () => apiFetch<import('@/types').DockerSnapshot>('/api/v1/docker'),
    containers:(all = true) => apiFetch<import('@/types').Container[]>(`/api/v1/docker/containers?all=${all}`),
    stats:     (id: string) => apiFetch<import('@/types').ContainerStats>(`/api/v1/docker/containers/${id}/stats`),
    logs:      (id: string, tail = 100) => apiFetch<{ logs: string[] }>(`/api/v1/docker/containers/${id}/logs?tail=${tail}`),
    start:     (id: string) => apiFetch(`/api/v1/docker/containers/${id}/start`,   { method: 'POST' }),
    stop:      (id: string) => apiFetch(`/api/v1/docker/containers/${id}/stop`,    { method: 'POST' }),
    restart:   (id: string) => apiFetch(`/api/v1/docker/containers/${id}/restart`, { method: 'POST' }),
    remove:    (id: string, force = false) => apiFetch(`/api/v1/docker/containers/${id}?force=${force}`, { method: 'DELETE' }),
    images:    () => apiFetch('/api/v1/docker/images'),
    volumes:   () => apiFetch('/api/v1/docker/volumes'),
    info:      () => apiFetch<import('@/types').DockerInfo>('/api/v1/docker/info'),
  },

  processes: {
    list: (limit = 20) => apiFetch<import('@/types').ProcessSnapshot>(`/api/v1/processes?limit=${limit}`),
    kill: (pid: number, signal = 'SIGTERM') => apiFetch(`/api/v1/processes/${pid}?signal=${signal}`, { method: 'DELETE' }),
  },

  logs: {
    system: (params?: { lines?: number; unit?: string; since?: string; priority?: number }) => {
      const q = new URLSearchParams();
      if (params?.lines)    q.set('lines',    String(params.lines));
      if (params?.unit)     q.set('unit',     params.unit);
      if (params?.since)    q.set('since',    params.since);
      if (params?.priority !== undefined) q.set('priority', String(params.priority));
      return apiFetch<{ timestamp: number; logs: import('@/types').LogEntry[] }>(`/api/v1/logs?${q}`);
    },
    kernel: (lines = 50) => apiFetch(`/api/v1/logs/kernel?lines=${lines}`),
    auth:   (lines = 50) => apiFetch(`/api/v1/logs/auth?lines=${lines}`),
    units:  () => apiFetch('/api/v1/logs/units'),
  },
};
