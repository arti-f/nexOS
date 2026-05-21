// ─── SYSTEM ──────────────────────────────────────────────────────────────────
export interface CpuInfo {
  usage: number;
  iowait: number;
  model: string;
  cores: number;
  architecture: string;
}

export interface RamInfo {
  total: number; used: number; free: number;
  buffers: number; cached: number; available: number; percent: number;
}

export interface SwapInfo {
  total: number; used: number; free: number; percent: number;
}

export interface DiskPartition {
  device: string; mount: string; fstype: string;
  size: number; used: number; avail: number; percent: number;
}

export interface UptimeInfo { seconds: number; human: string; }

export interface HostInfo {
  hostname: string; os: string; os_id: string;
  os_version: string; kernel: string; arch: string;
}

export interface SystemSnapshot {
  timestamp: number;
  host: HostInfo;
  cpu: CpuInfo;
  memory: { ram: RamInfo; swap: SwapInfo };
  disk: DiskPartition[];
  disk_io: { read_kbs: number; write_kbs: number };
  uptime: UptimeInfo;
}

// ─── NETWORK ─────────────────────────────────────────────────────────────────
export interface NetworkInterface {
  interface: string;
  rx_bytes: number; tx_bytes: number;
  rx_packets: number; tx_packets: number;
  rx_errors: number; tx_errors: number; rx_drop: number;
  rx_speed: number; tx_speed: number;
  rx_speed_mb: string; tx_speed_mb: string;
  name?: string; mac?: string; state?: string; mtu?: number;
  addresses?: Array<{ family: string; address: string; prefix: number; broadcast?: string }>;
}

export interface NetworkSnapshot {
  timestamp: number;
  interfaces: NetworkInterface[];
  connections: { tcp_connections: number };
  dns: { nameservers: string[] };
}

// ─── DOCKER ──────────────────────────────────────────────────────────────────
export type ContainerState = 'running' | 'exited' | 'paused' | 'restarting' | 'dead' | 'created';

export interface Container {
  id: string; id_full: string; name: string; image: string;
  status: string; state: ContainerState; created: number;
  ports: Array<{ private: number; public: number | null; type: string }>;
  networks: string[];
}

export interface ContainerStats {
  id: string; cpu_percent: number;
  mem_usage_mb: number; mem_limit_mb: number; mem_percent: number;
  net_rx_mb: string; net_tx_mb: string; pids: number;
}

export interface DockerInfo {
  version: string; containers: number; running: number;
  paused: number; stopped: number; images: number;
  mem_total_mb: number; os: string; kernel: string; cpus: number;
}

export interface DockerSnapshot {
  timestamp: number; info: DockerInfo; containers: Container[];
}

// ─── PROCESSES ───────────────────────────────────────────────────────────────
export interface Process {
  pid: number; name: string; state: string;
  cpu_percent: number; mem_mb: number; mem_kb: number; vsize_mb: number;
}

export interface ProcessSnapshot {
  timestamp: number;
  summary: { total: number; running: number; timestamp: number };
  processes: Process[];
}

// ─── LOGS ────────────────────────────────────────────────────────────────────
export interface LogEntry {
  timestamp: number; unit: string; message: string;
  priority: number; pid: number | null;
}

// ─── WEBSOCKET STREAM ────────────────────────────────────────────────────────
export interface MetricsFrame {
  ts: number;
  cpu: { usage: number; iowait: number };
  ram: { percent: number; used: number; total: number };
  swap: { percent: number };
  net: Array<{ interface: string; rx_speed_mb: string; tx_speed_mb: string }>;
}

// ─── UI ──────────────────────────────────────────────────────────────────────
export type NavPage =
  | 'overview' | 'processes' | 'metrics' | 'alerts'
  | 'applications' | 'storage' | 'network' | 'security'
  | 'docker' | 'ssh' | 'cron' | 'logs';
