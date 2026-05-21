import { useState, useMemo, useRef, useEffect } from 'react';
import { T } from '@/utils/tokens';
import { Card } from '@/components/ui/Card';
import {
  useAppStore, useDeployApp, useStopApp, useRemoveApp,
} from '@/api/appstore.queries';
import type { CatalogApp, AppCategory, AppEnvVar, ResourceCpu } from '@/types/appstore';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CPU_COLOR: Record<ResourceCpu, string> = {
  low:    T.acc3,
  medium: T.acc4,
  high:   T.accR,
};
const CPU_LABEL: Record<ResourceCpu, string> = {
  low: 'Low CPU', medium: 'Med CPU', high: 'High CPU',
};

const SORT_OPTIONS = [
  { value: 'installs', label: 'Most Installed' },
  { value: 'stars',    label: 'Top Rated' },
  { value: 'name',     label: 'A → Z' },
];

// ─── STAR RATING ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          fontSize: 10,
          color: i <= Math.round(rating) ? T.acc4 : T.txt3,
        }}>★</span>
      ))}
      <span style={{ fontSize: 10, color: T.txt2, fontFamily: T.mono, marginLeft: 3 }}>{rating}</span>
    </div>
  );
}

// ─── RESOURCE BADGE ──────────────────────────────────────────────────────────
function ResourceBadge({ cpu, ram_mb, disk_mb }: { cpu: ResourceCpu; ram_mb: number; disk_mb: number }) {
  const c = CPU_COLOR[cpu];
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      <Tag color={c}>{CPU_LABEL[cpu]}</Tag>
      <Tag color={T.acc2}>{ram_mb >= 1024 ? `${(ram_mb/1024).toFixed(1)}GB` : `${ram_mb}MB`} RAM</Tag>
      <Tag color={T.txt2}>{disk_mb >= 1024 ? `${(disk_mb/1024).toFixed(0)}GB` : `${disk_mb}MB`} disk</Tag>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 6px', borderRadius: 4,
      background: `${color}15`, color, fontFamily: T.mono,
      border: `1px solid ${color}25`,
    }}>{children}</span>
  );
}

// ─── APP CARD ────────────────────────────────────────────────────────────────
function AppCard({
  app,
  onSelect,
}: {
  app: CatalogApp;
  onSelect: (app: CatalogApp) => void;
}) {
  const isInstalled = app.installed;
  const isRunning   = app.running;

  return (
    <div
      onClick={() => onSelect(app)}
      style={{
        background: T.bg1,
        border: `1px solid ${isInstalled ? `${T.acc}25` : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.18s',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `${T.acc}40`;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 8px 32px rgba(0,229,255,0.06)`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isInstalled ? `${T.acc}25` : 'rgba(255,255,255,0.06)';
        el.style.transform = '';
        el.style.boxShadow = '';
      }}
    >
      {/* Installed ribbon */}
      {isInstalled && (
        <div style={{
          position: 'absolute', top: 10, right: -22,
          background: isRunning ? T.acc3 : T.acc4,
          color: '#000', fontSize: 9, fontWeight: 700,
          padding: '3px 28px', transform: 'rotate(35deg)',
          letterSpacing: 0.5,
        }}>
          {isRunning ? 'RUNNING' : 'STOPPED'}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: T.bg3, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 24, flexShrink: 0,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}>{app.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 2 }}>{app.name}</div>
          <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.4 }}>{app.tagline}</div>
          <div style={{ marginTop: 5 }}>
            <Stars rating={app.stars} />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {app.tags.slice(0, 4).map(tag => (
          <span key={tag} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: T.bg3, color: T.txt3,
          }}>#{tag}</span>
        ))}
      </div>

      {/* Resources */}
      <ResourceBadge {...app.resources} />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: `1px solid rgba(255,255,255,0.05)`,
        marginTop: 'auto',
      }}>
        <div style={{ fontSize: 10, color: T.txt3, fontFamily: T.mono }}>
          {(app.installs / 1000).toFixed(1)}k installs
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {app.arch.map(a => (
            <span key={a} style={{
              fontSize: 9, padding: '2px 5px', borderRadius: 4,
              background: `${T.acc}10`, color: T.acc, fontFamily: T.mono,
            }}>{a}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ENV EDITOR ──────────────────────────────────────────────────────────────
function EnvEditor({
  vars,
  values,
  onChange,
}: {
  vars: AppEnvVar[];
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  if (!vars.length) return (
    <div style={{ color: T.txt2, fontSize: 12, padding: '8px 0' }}>
      No configuration required — uses safe defaults.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {vars.map(v => (
        <div key={v.key}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.txt }}>{v.label}</span>
            {v.required && (
              <span style={{ fontSize: 9, color: T.accR, background: `${T.accR}15`, padding: '1px 5px', borderRadius: 4 }}>required</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: T.txt3, fontFamily: T.mono, minWidth: 160 }}>{v.key}</span>
            <input
              value={values[v.key] ?? v.value}
              onChange={e => onChange(v.key, e.target.value)}
              style={{
                flex: 1,
                background: T.bg0, border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 7, padding: '6px 10px',
                color: T.txt, fontFamily: T.mono, fontSize: 11,
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = `${T.acc}50`)}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── APP DETAIL DRAWER ───────────────────────────────────────────────────────
function AppDrawer({
  app,
  onClose,
}: {
  app: CatalogApp;
  onClose: () => void;
}) {
  const deploy = useDeployApp();
  const stop   = useStopApp();
  const remove = useRemoveApp();

  const [envValues, setEnvValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(app.environment.map(e => [e.key, e.value]))
  );
  const [tab, setTab] = useState<'overview' | 'compose' | 'ports' | 'volumes'>('overview');
  const [deploying, setDeploying]   = useState(false);
  const [deployMsg, setDeployMsg]   = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployMsg(null);
    setDeployError(null);
    try {
      const result = await deploy.mutateAsync({ id: app.id, env: envValues });
      setDeployMsg(result.stderr || result.stdout || 'Deployed successfully!');
    } catch (err: unknown) {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleStop = async () => {
    try { await stop.mutateAsync(app.id); } catch {}
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${app.name}? This will stop all containers.`)) return;
    try { await remove.mutateAsync({ id: app.id }); onClose(); } catch {}
  };

  const tabs: Array<typeof tab> = ['overview', 'compose', 'ports', 'volumes'];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 300, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 560,
        background: T.bg1, zIndex: 301, overflowY: 'auto',
        borderLeft: `1px solid rgba(255,255,255,0.08)`,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        `}</style>

        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          display: 'flex', gap: 16, alignItems: 'flex-start',
          background: T.bg2, flexShrink: 0,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: T.bg3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0, border: `1px solid rgba(255,255,255,0.08)`,
          }}>{app.icon}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>{app.name}</span>
              {app.installed && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20,
                  background: app.running ? `${T.acc3}18` : `${T.acc4}18`,
                  color: app.running ? T.acc3 : T.acc4,
                }}>{app.running ? '● Running' : '○ Stopped'}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>{app.tagline}</div>
            <div style={{ marginTop: 5 }}><Stars rating={app.stars} /></div>
          </div>

          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: T.txt2, cursor: 'pointer', fontSize: 20, padding: 4,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '0 24px',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          background: T.bg2, flexShrink: 0,
        }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? T.acc : 'transparent'}`,
              color: tab === t ? T.acc : T.txt2,
              padding: '10px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              fontFamily: T.ff, transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 13, color: T.txt2, lineHeight: 1.7 }}>{app.description}</div>

              <div>
                <SectionLabel>Author</SectionLabel>
                <div style={{ fontSize: 12, color: T.txt }}>
                  {app.author} · <a href={app.website} target="_blank" rel="noreferrer" style={{ color: T.acc, textDecoration: 'none' }}>Website ↗</a>
                </div>
              </div>

              <div>
                <SectionLabel>Docker Image</SectionLabel>
                <div style={{
                  background: T.bg0, borderRadius: 8, padding: '8px 12px',
                  fontFamily: T.mono, fontSize: 11, color: T.acc,
                  border: `1px solid rgba(255,255,255,0.06)`,
                }}>{app.image}</div>
              </div>

              <div>
                <SectionLabel>Resources</SectionLabel>
                <ResourceBadge {...app.resources} />
              </div>

              <div>
                <SectionLabel>Architecture</SectionLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  {app.arch.map(a => (
                    <Tag key={a} color={T.acc}>{a}</Tag>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Tags</SectionLabel>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {app.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, color: T.txt3, background: T.bg3, padding: '2px 7px', borderRadius: 4 }}>#{t}</span>
                  ))}
                </div>
              </div>

              {app.environment.length > 0 && (
                <div>
                  <SectionLabel>Configuration</SectionLabel>
                  <EnvEditor vars={app.environment} values={envValues} onChange={(k, v) => setEnvValues(prev => ({...prev, [k]: v}))} />
                </div>
              )}
            </div>
          )}

          {tab === 'compose' && (
            <div>
              <div style={{ marginBottom: 12, fontSize: 12, color: T.txt2 }}>
                Docker Compose stack definition. Edit the configuration fields in the Overview tab before deploying.
              </div>
              <div style={{
                background: T.bg0, borderRadius: 10, padding: 16,
                fontFamily: T.mono, fontSize: 11, color: T.txt2, lineHeight: 1.8,
                border: `1px solid rgba(255,255,255,0.06)`,
                whiteSpace: 'pre-wrap', overflowX: 'auto',
              }}>
                {/* Syntax highlight keywords */}
                {app.compose.split('\n').map((line, i) => {
                  const isKey    = /^(\s*)(version|services|image|container_name|restart|ports|volumes|environment|networks|command|cap_add|sysctls|depends_on|privileged|network_mode):/.test(line);
                  const isValue  = /^(\s+)-\s/.test(line);
                  const isComment = line.trim().startsWith('#');
                  const color    = isComment ? T.txt3 : isKey ? T.acc : isValue ? T.txt2 : T.txt;
                  return <div key={i} style={{ color }}>{line || ' '}</div>;
                })}
              </div>
            </div>
          )}

          {tab === 'ports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {app.ports.map(p => (
                <div key={`${p.host}:${p.container}`} style={{
                  display: 'grid', gridTemplateColumns: '80px 80px 1fr 60px',
                  gap: 12, alignItems: 'center',
                  background: T.bg2, borderRadius: 9, padding: '10px 14px',
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.acc, fontWeight: 700 }}>{p.host}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.txt3 }}>→ {p.container}</div>
                  <div style={{ fontSize: 11, color: T.txt2 }}>{p.label}</div>
                  <Tag color={p.protocol === 'udp' ? T.acc4 : T.acc2}>{p.protocol.toUpperCase()}</Tag>
                </div>
              ))}
              {app.ports.length === 0 && (
                <div style={{ color: T.txt2, fontSize: 12 }}>No exposed ports.</div>
              )}
            </div>
          )}

          {tab === 'volumes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {app.volumes.map((v, i) => (
                <div key={i} style={{
                  background: T.bg2, borderRadius: 9, padding: '10px 14px',
                }}>
                  <div style={{ fontSize: 11, color: T.txt2, marginBottom: 6 }}>{v.label}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 10, fontFamily: T.mono, color: T.acc4, background: `${T.acc4}10`, padding: '2px 6px', borderRadius: 4 }}>{v.host}</code>
                    <span style={{ color: T.txt3, fontSize: 12 }}>→</span>
                    <code style={{ fontSize: 10, fontFamily: T.mono, color: T.acc2, background: `${T.acc2}10`, padding: '2px 6px', borderRadius: 4 }}>{v.container}</code>
                  </div>
                </div>
              ))}
              {app.volumes.length === 0 && (
                <div style={{ color: T.txt2, fontSize: 12 }}>No volumes configured.</div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          background: T.bg2, flexShrink: 0,
        }}>
          {deployMsg && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              background: `${T.acc3}10`, border: `1px solid ${T.acc3}30`,
              fontSize: 11, color: T.acc3, fontFamily: T.mono,
              maxHeight: 80, overflowY: 'auto',
            }}>{deployMsg}</div>
          )}
          {deployError && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              background: `${T.accR}10`, border: `1px solid ${T.accR}30`,
              fontSize: 11, color: T.accR, fontFamily: T.mono,
            }}>{deployError}</div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {!app.installed ? (
              <PrimaryBtn
                label={deploying ? '⏳ Deploying...' : `🚀 Deploy ${app.name}`}
                onClick={handleDeploy}
                disabled={deploying}
                color={T.acc}
              />
            ) : (
              <>
                <PrimaryBtn
                  label={deploying ? '⏳ Updating...' : '↺ Redeploy'}
                  onClick={handleDeploy}
                  disabled={deploying}
                  color={T.acc2}
                />
                {app.running && (
                  <GhostBtn label="■ Stop" color={T.acc4} onClick={handleStop} />
                )}
                <GhostBtn label="🗑 Remove" color={T.accR} onClick={handleRemove} />
              </>
            )}
            <GhostBtn label="Cancel" color={T.txt2} onClick={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: T.txt3, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ label, onClick, disabled, color }: { label: string; onClick: () => void; disabled?: boolean; color: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color, border: 'none',
      borderRadius: 9, padding: '9px 18px', fontSize: 12,
      fontFamily: T.ff, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      color: '#000', opacity: disabled ? 0.6 : 1,
      flex: 1, transition: 'opacity 0.15s',
    }}>{label}</button>
  );
}

function GhostBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}15`, border: `1px solid ${color}30`,
      borderRadius: 9, padding: '9px 16px', fontSize: 12,
      fontFamily: T.ff, fontWeight: 600, cursor: 'pointer',
      color, transition: 'all 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = `${color}25`}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = `${color}15`}
    >{label}</button>
  );
}

// ─── CATEGORY SIDEBAR ────────────────────────────────────────────────────────
function CategoryList({
  categories,
  selected,
  onSelect,
  counts,
}: {
  categories: AppCategory[];
  selected: string;
  onSelect: (id: string) => void;
  counts: Record<string, number>;
}) {
  const all = [{ id: 'all', label: 'All Apps', icon: '🧩' }, ...categories];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {all.map(cat => {
        const active = selected === cat.id;
        const count  = cat.id === 'all' ? Object.values(counts).reduce((a,b) => a+b, 0) : (counts[cat.id] ?? 0);
        return (
          <div key={cat.id} onClick={() => onSelect(cat.id)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
            background: active ? `${T.acc}0e` : 'transparent',
            border: active ? `1px solid ${T.acc}25` : '1px solid transparent',
            color: active ? T.acc : T.txt2, fontSize: 12, fontWeight: 500,
            transition: 'all 0.14s',
          }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = T.bg3; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 15, width: 18, flexShrink: 0 }}>{cat.icon}</span>
            <span style={{ flex: 1 }}>{cat.label}</span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 10,
              background: active ? `${T.acc}20` : T.bg3, color: active ? T.acc : T.txt3,
              fontFamily: T.mono,
            }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function ApplicationsPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('installs');
  const [selected, setSelected] = useState<CatalogApp | null>(null);
  const searchRef               = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useAppStore({ category, search, sort });

  const apps       = data?.apps ?? [];
  const categories = data?.categories ?? [];

  // Category counts across full catalog
  const counts = useMemo(() => {
    if (!data) return {};
    const all = data.apps;
    return all.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [data]);

  // ⌘K shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const installedCount = apps.filter(a => a.installed).length;

  return (
    <>
      {/* App drawer */}
      {selected && <AppDrawer app={selected} onClose={() => setSelected(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: T.txt }}>App Store</div>
            <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>
              {apps.length} apps available · {installedCount} installed
            </div>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 6 }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setSort(o.value)} style={{
                background: sort === o.value ? T.bg3 : 'transparent',
                border: `1px solid ${sort === o.value ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8, padding: '6px 12px', fontSize: 11,
                color: sort === o.value ? T.txt : T.txt2, cursor: 'pointer',
                fontFamily: T.ff, fontWeight: 600, transition: 'all 0.14s',
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: T.bg1, border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 11, padding: '0 14px',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <span style={{ color: T.txt3, fontSize: 16 }}>⌕</span>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search apps, tags, descriptions... (⌘K)"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: T.txt, fontFamily: T.ff, fontSize: 13, padding: '12px 0',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'transparent', border: 'none',
              color: T.txt3, cursor: 'pointer', fontSize: 16,
            }}>✕</button>
          )}
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.txt3 }}>⌘K</span>
        </div>

        {/* Body: category nav + grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, flex: 1, minHeight: 0 }}>

          {/* Category sidebar */}
          <div style={{
            background: T.bg1, border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 14, padding: 12, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 10, color: T.txt3, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px 8px', fontWeight: 600 }}>
              Categories
            </div>
            <CategoryList
              categories={categories}
              selected={category}
              onSelect={setCategory}
              counts={counts}
            />

            {/* Installed section */}
            {installedCount > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
                <div style={{ fontSize: 10, color: T.txt3, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px 8px', fontWeight: 600 }}>
                  Installed
                </div>
                <div onClick={() => { setCategory('all'); setSearch('installed'); }} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
                  color: T.acc3, fontSize: 12, fontWeight: 500,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bg3}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <span>●</span>
                  <span style={{ flex: 1 }}>Installed Apps</span>
                  <span style={{ fontSize: 10, background: `${T.acc3}20`, color: T.acc3, padding: '1px 6px', borderRadius: 10, fontFamily: T.mono }}>{installedCount}</span>
                </div>
              </>
            )}
          </div>

          {/* App grid */}
          <div style={{ overflowY: 'auto' }}>
            {isLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} style={{
                    height: 200, borderRadius: 14,
                    background: T.bg1, border: `1px solid rgba(255,255,255,0.06)`,
                    animation: 'pulse 1.5s ease infinite',
                    opacity: 1 - i * 0.05,
                  }} />
                ))}
              </div>
            )}

            {error && (
              <div style={{
                background: `${T.acc4}10`, border: `1px solid ${T.acc4}30`,
                borderRadius: 12, padding: 20, color: T.acc4, fontSize: 13,
              }}>
                ⚠ Cannot load app catalog. Make sure nexos-api is running at {' '}
                <code style={{ fontFamily: T.mono }}>{import.meta.env.VITE_API_URL || 'http://localhost:3001'}</code>.
                <div style={{ marginTop: 8, fontSize: 11, color: T.txt2 }}>
                  The catalog is served from <code style={{ fontFamily: T.mono }}>/api/v1/apps</code>. See nexos-api setup in nexos-appstore/README.md.
                </div>
              </div>
            )}

            {!isLoading && !error && apps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.txt2 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>No apps found</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Try a different search or category.</div>
              </div>
            )}

            {!isLoading && apps.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
                <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }`}</style>
                {apps.map(app => (
                  <AppCard key={app.id} app={app} onSelect={setSelected} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
