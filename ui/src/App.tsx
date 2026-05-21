import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Topbar }  from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/stores/ui';
import { T } from '@/utils/tokens';
import {
  OverviewPage, DockerPage, ProcessesPage,
  NetworkPage, LogsPage, StoragePage,
  ApplicationsPage, PlaceholderPage,
} from '@/pages';
import type { NavPage } from '@/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PageRouter() {
  const page = useUIStore(s => s.activePage);

  const pages: Record<NavPage, JSX.Element> = {
    overview:     <OverviewPage />,
    docker:       <DockerPage />,
    processes:    <ProcessesPage />,
    network:      <NetworkPage />,
    logs:         <LogsPage />,
    storage:      <StoragePage />,
    metrics:      <PlaceholderPage title="Metrics" icon="📈" description="Advanced time-series charts powered by Prometheus/InfluxDB" />,
    alerts:       <PlaceholderPage title="Alerts" icon="🔔" description="Rule-based alerting — CPU spikes, memory pressure, disk full" />,
    applications: <ApplicationsPage />,
    security:     <PlaceholderPage title="Security" icon="🔒" description="Firewall rules, fail2ban, audit log, SSL certs" />,
    ssh:          <PlaceholderPage title="SSH Keys" icon="🔑" description="Manage authorized_keys, generate key pairs" />,
    cron:         <PlaceholderPage title="Cron Jobs" icon="⚡" description="Schedule and monitor recurring tasks" />,
  };

  return pages[page] ?? <OverviewPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { background: ${T.bg0}; color: ${T.txt}; font-family: ${T.ff}; font-size: 13px; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bg0}; }
        ::-webkit-scrollbar-thumb { background: ${T.bg3}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.bg4}; }
        input::placeholder { color: ${T.txt3}; }
        button { font-family: ${T.ff}; }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '52px 1fr',
        height: '100vh',
        background: T.bg0,
        overflow: 'hidden',
      }}>
        <Topbar />
        <Sidebar />
        <main style={{
          background: T.bg0,
          overflowY: 'auto',
          padding: 20,
        }}>
          <PageRouter />
        </main>
      </div>
    </QueryClientProvider>
  );
}
