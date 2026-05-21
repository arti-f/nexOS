import { T } from '@/utils/tokens';
import { useUIStore } from '@/stores/ui';
import type { NavPage } from '@/types';

interface NavItem {
  icon: string;
  label: string;
  page: NavPage;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: 'Monitor',
    items: [
      { icon: '⬡', label: 'Overview',  page: 'overview'  },
      { icon: '⚙', label: 'Processes', page: 'processes', badge: '5',  badgeColor: T.acc  },
      { icon: '📈', label: 'Metrics',   page: 'metrics'   },
      { icon: '🔔', label: 'Alerts',    page: 'alerts',   badge: '2',  badgeColor: T.accR },
    ],
  },
  {
    section: 'System',
    items: [
      { icon: '🧩', label: 'Applications', page: 'applications', badge: '12', badgeColor: T.acc2 },
      { icon: '💾', label: 'Storage',      page: 'storage'      },
      { icon: '🌐', label: 'Network',      page: 'network'      },
      { icon: '🔒', label: 'Security',     page: 'security',    badge: '1',  badgeColor: T.acc4 },
    ],
  },
  {
    section: 'Config',
    items: [
      { icon: '🐳', label: 'Docker',   page: 'docker', badge: '6', badgeColor: T.acc },
      { icon: '🔑', label: 'SSH Keys', page: 'ssh'    },
      { icon: '⚡', label: 'Cron Jobs',page: 'cron',  badge: '3'  },
      { icon: '📋', label: 'Logs',     page: 'logs'   },
    ],
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, color: T.txt3, letterSpacing: '1.5px',
      textTransform: 'uppercase', padding: '12px 10px 5px', fontWeight: 600,
    }}>{children}</div>
  );
}

function NavItemRow({ icon, label, page, badge, badgeColor }: NavItem) {
  const activePage = useUIStore(s => s.activePage);
  const setActivePage = useUIStore(s => s.setActivePage);
  const active = activePage === page;
  const bc = badgeColor ?? T.acc2;

  return (
    <div
      onClick={() => setActivePage(page)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
        transition: 'all 0.15s',
        color: active ? T.acc : T.txt2, fontSize: 12, fontWeight: 500,
        background: active ? `${T.acc}0d` : 'transparent',
        border: active ? `1px solid ${T.acc}20` : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = T.bg3;
          el.style.color = T.txt;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = 'transparent';
          el.style.color = T.txt2;
        }
      }}
    >
      <span style={{ fontSize: 16, width: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 10,
          background: bc, color: '#000',
          fontFamily: T.mono,
        }}>{badge}</span>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <div style={{
      background: T.bg1,
      borderRight: `1px solid rgba(255,255,255,0.05)`,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      padding: '12px 10px',
    }}>
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <SectionLabel>{section}</SectionLabel>
          {items.map(item => <NavItemRow key={item.page} {...item} />)}
        </div>
      ))}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ fontSize: 10, color: T.txt3, padding: '8px 10px', fontFamily: T.mono }}>
          <div>nexos-host · 192.168.1.50</div>
          <div style={{ marginTop: 3 }}>Arch Linux · Kernel 6.6.33</div>
        </div>
      </div>
    </div>
  );
}
