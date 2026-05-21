// ─── APP STORE QUERIES (add to src/api/queries.ts) ──────────────────────────
// These hooks extend the existing React Query setup in nexos-ui.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { AppCatalogResponse, CatalogApp, AppDeployPayload } from '@/types/appstore';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ─── FETCH HELPERS ───────────────────────────────────────────────────────────
async function fetchApps(params: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<AppCatalogResponse> {
  const q = new URLSearchParams();
  if (params.category && params.category !== 'all') q.set('category', params.category);
  if (params.search)   q.set('search', params.search);
  if (params.sort)     q.set('sort',   params.sort);
  const res = await fetch(`${BASE}/api/v1/apps?${q}`);
  if (!res.ok) throw new Error(`Apps API ${res.status}`);
  return res.json();
}

async function fetchApp(id: string): Promise<CatalogApp> {
  const res = await fetch(`${BASE}/api/v1/apps/${id}`);
  if (!res.ok) throw new Error(`App ${id} not found`);
  return res.json();
}

async function deployApp(id: string, payload: AppDeployPayload) {
  const res = await fetch(`${BASE}/api/v1/apps/${id}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Deploy failed');
  }
  return res.json();
}

async function stopApp(id: string) {
  const res = await fetch(`${BASE}/api/v1/apps/${id}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Stop failed: ${res.statusText}`);
  return res.json();
}

async function removeApp(id: string, removeVolumes = false) {
  const res = await fetch(`${BASE}/api/v1/apps/${id}?volumes=${removeVolumes}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Remove failed: ${res.statusText}`);
  return res.json();
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
export interface UseAppStoreOptions {
  category?: string;
  search?: string;
  sort?: string;
}

export function useAppStore(options: UseAppStoreOptions = {}) {
  return useQuery({
    queryKey: ['apps', options],
    queryFn: () => fetchApps(options),
    staleTime: 30_000,
  });
}

export function useApp(id: string | null) {
  return useQuery({
    queryKey: ['apps', id],
    queryFn: () => fetchApp(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useDeployApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, env }: { id: string; env?: Record<string, string> }) =>
      deployApp(id, { env }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useStopApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stopApp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }),
  });
}

export function useRemoveApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, removeVolumes }: { id: string; removeVolumes?: boolean }) =>
      removeApp(id, removeVolumes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }),
  });
}
