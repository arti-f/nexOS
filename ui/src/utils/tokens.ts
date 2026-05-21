// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Single source of truth — imported by all components
export const T = {
  // Backgrounds (dark to mid)
  bg0: '#080910', bg1: '#0d0f14', bg2: '#12151d',
  bg3: '#171b26', bg4: '#1d2235',

  // Accents
  acc:  '#00e5ff',  // cyan
  acc2: '#7c3aed',  // violet
  acc3: '#00d68f',  // emerald
  acc4: '#ffb547',  // amber
  accR: '#ff4d6d',  // red
  accP: '#e040fb',  // pink

  // Text
  txt:  '#dde3f0',
  txt2: '#7a8499',
  txt3: '#3d4558',

  // Typography
  ff:   "'Syne', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// Named accent map for StatCard color prop
export const ACCENT_MAP: Record<string, string> = {
  cyan:   T.acc,
  purple: T.acc2,
  green:  T.acc3,
  amber:  T.acc4,
  red:    T.accR,
  pink:   T.accP,
};

// Log priority → color
export const LOG_PRIORITY_COLOR: Record<number, string> = {
  0: T.accR, 1: T.accR, 2: T.accR,
  3: T.accR, 4: T.acc4, 5: T.acc4,
  6: T.txt2, 7: T.txt3,
};

export const LOG_PRIORITY_LABEL: Record<number, string> = {
  0: 'EMERG', 1: 'ALERT', 2: 'CRIT',
  3: 'ERROR', 4: 'WARN',  5: 'NOTICE',
  6: 'INFO',  7: 'DEBUG',
};

// Format bytes to human-readable
export function fmtBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function fmtMB(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
