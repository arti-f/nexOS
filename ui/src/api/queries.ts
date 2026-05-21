// ─── REACT QUERY HOOKS ────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

const REFETCH = 4000; // ms

// ─── SYSTEM ──────────────────────────────────────────────────────────────────
export function useSystemSnapshot() {
  return useQuery({
    queryKey: ['system'],
    queryFn: api.system.snapshot,
    refetchInterval: REFETCH,
    staleTime: 2000,
  });
}

export function useHostInfo() {
  return useQuery({
    queryKey: ['system', 'host'],
    queryFn: api.system.host,
    staleTime: 60_000, // host info rarely changes
  });
}

// ─── NETWORK ─────────────────────────────────────────────────────────────────
export function useNetworkSnapshot() {
  return useQuery({
    queryKey: ['network'],
    queryFn: api.network.snapshot,
    refetchInterval: REFETCH,
    staleTime: 2000,
  });
}

// ─── DOCKER ──────────────────────────────────────────────────────────────────
export function useDockerSnapshot() {
  return useQuery({
    queryKey: ['docker'],
    queryFn: api.docker.snapshot,
    refetchInterval: 6000,
    staleTime: 3000,
  });
}

export function useContainerStats(id: string | null) {
  return useQuery({
    queryKey: ['docker', 'stats', id],
    queryFn: () => api.docker.stats(id!),
    enabled: !!id,
    refetchInterval: 2000,
  });
}

export function useContainerLogs(id: string | null, tail = 100) {
  return useQuery({
    queryKey: ['docker', 'logs', id, tail],
    queryFn: () => api.docker.logs(id!, tail),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

// Docker mutations
export function useContainerAction() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['docker'] });

  const start   = useMutation({ mutationFn: (id: string) => api.docker.start(id),   onSuccess: invalidate });
  const stop    = useMutation({ mutationFn: (id: string) => api.docker.stop(id),    onSuccess: invalidate });
  const restart = useMutation({ mutationFn: (id: string) => api.docker.restart(id), onSuccess: invalidate });
  const remove  = useMutation({ mutationFn: ({ id, force }: { id: string; force?: boolean }) => api.docker.remove(id, force), onSuccess: invalidate });

  return { start, stop, restart, remove };
}

// ─── PROCESSES ───────────────────────────────────────────────────────────────
export function useProcesses(limit = 20) {
  return useQuery({
    queryKey: ['processes', limit],
    queryFn: () => api.processes.list(limit),
    refetchInterval: 3000,
    staleTime: 1500,
  });
}

export function useKillProcess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, signal }: { pid: number; signal?: string }) =>
      api.processes.kill(pid, signal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processes'] }),
  });
}

// ─── LOGS ────────────────────────────────────────────────────────────────────
export function useSystemLogs(params?: Parameters<typeof api.logs.system>[0]) {
  return useQuery({
    queryKey: ['logs', 'system', params],
    queryFn: () => api.logs.system(params),
    refetchInterval: 10_000,
    staleTime: 5000,
  });
}

export function useAuthLogs(lines = 50) {
  return useQuery({
    queryKey: ['logs', 'auth', lines],
    queryFn: () => api.logs.auth(lines),
    refetchInterval: 15_000,
  });
}

export function useKernelLogs(lines = 50) {
  return useQuery({
    queryKey: ['logs', 'kernel', lines],
    queryFn: () => api.logs.kernel(lines),
    refetchInterval: 15_000,
  });
}
