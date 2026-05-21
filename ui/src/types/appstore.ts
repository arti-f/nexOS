// ─── APP STORE TYPES (add to src/types/index.ts) ────────────────────────────

export type ResourceCpu = 'low' | 'medium' | 'high';

export interface AppPort {
  container: number;
  host: number;
  protocol: 'tcp' | 'udp';
  label: string;
}

export interface AppVolume {
  host: string;
  container: string;
  label: string;
}

export interface AppEnvVar {
  key: string;
  value: string;
  label: string;
  required: boolean;
}

export interface AppResources {
  cpu: ResourceCpu;
  ram_mb: number;
  disk_mb: number;
}

export interface CatalogApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  author: string;
  website: string;
  stars: number;
  installs: number;
  ports: AppPort[];
  volumes: AppVolume[];
  environment: AppEnvVar[];
  image: string;
  compose: string;
  resources: AppResources;
  arch: string[];
  // runtime (from backend)
  installed?: boolean;
  installed_at?: string | null;
  container_id?: string | null;
  running?: boolean;
}

export interface AppCategory {
  id: string;
  label: string;
  icon: string;
}

export interface AppCatalogResponse {
  apps: CatalogApp[];
  categories: AppCategory[];
  total: number;
}

export interface AppDeployPayload {
  env?: Record<string, string>;
}
