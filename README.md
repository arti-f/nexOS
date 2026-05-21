# NexOS

Self-hosted Linux dashboard — system monitoring, Docker management, App Store, log viewer, and more. Built for Debian 12 on Proxmox LXC (also works on Ubuntu, Arch, bare metal).

---

## Quick Install (Debian 12 / Ubuntu)

```bash
# Download and extract (or clone from git)
apt install -y git && git clone https://github.com/arti-f/nexOS.git && cd nexOS && sudo bash scripts/install.sh

# Done — open browser:
#   http://<server-ip>:3000
```

### Install options

```bash
sudo bash scripts/install.sh --port-ui 8080 --port-api 8081
sudo bash scripts/install.sh --dir /home/myuser/nexos
sudo bash scripts/install.sh --skip-docker   # if Docker already installed
```

---

## Proxmox LXC Notes

### Recommended LXC configuration

In Proxmox UI → CT Options:
- **Nesting**: ✅ Enabled
- **Unprivileged**: ✅ (recommended, safer)

Or in `/etc/pve/lxc/<ctid>.conf`:
```
features: keyctl=1,nesting=1
```

### Docker in LXC (two options)

**Option A — Install Docker inside LXC** (requires nesting=1):
```bash
sudo bash scripts/install.sh   # Docker will be installed automatically
```

**Option B — Use host Docker socket** (bind-mount):

Add to `/etc/pve/lxc/<ctid>.conf` on Proxmox host:
```
lxc.mount.entry: /var/run/docker.sock var/run/docker.sock none bind,create=file 0 0
```

Then restart CT and run installer with `--skip-docker`.

---

## What's Inside

```
nexos/
├── api/                    ← Node.js / Fastify backend
│   ├── src/
│   │   ├── server.js           Main entry point
│   │   ├── routes/             REST + WebSocket routes
│   │   │   ├── system.js       GET /api/v1/system/**
│   │   │   ├── docker.js       GET/POST /api/v1/docker/**
│   │   │   ├── network.js      GET /api/v1/network/**
│   │   │   ├── processes.js    GET/DELETE /api/v1/processes/**
│   │   │   ├── logs.js         GET /api/v1/logs/**
│   │   │   ├── stream.js       WS /api/v1/stream/metrics
│   │   │   └── apps.js         GET/POST/DELETE /api/v1/apps/**
│   │   ├── services/           Business logic
│   │   │   ├── system.js       /proc/stat, /proc/meminfo, df, uname
│   │   │   ├── network.js      /proc/net/dev, ip -j addr
│   │   │   ├── docker.js       Dockerode: containers, stats, actions
│   │   │   ├── processes.js    /proc/<pid>/stat — top processes
│   │   │   ├── logs.js         journalctl, dmesg, /var/log/auth.log
│   │   │   └── appstore.js     Catalog read, docker compose deploy
│   │   ├── catalog/
│   │   │   └── apps.json       15 curated Docker apps
│   │   ├── data/               installs.json (auto-created)
│   │   └── stacks/             docker-compose.yml per app (auto-created)
│   ├── package.json
│   └── .env                    (written by installer)
│
├── ui/                     ← React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx             Root + page router + QueryClient
│   │   ├── main.tsx            React entrypoint
│   │   ├── api/
│   │   │   ├── client.ts           Typed fetch wrapper (all 25+ endpoints)
│   │   │   ├── queries.ts          React Query hooks (system, docker, network...)
│   │   │   └── appstore.queries.ts React Query hooks (apps catalog)
│   │   ├── components/
│   │   │   ├── charts/Sparkline    Canvas sparkline with gradient fill
│   │   │   ├── layout/Topbar       Header with clock + WS status indicator
│   │   │   ├── layout/Sidebar      Nav with section groups + badges
│   │   │   └── ui/                 Card, MiniBar, StatCard, ServiceCard, UptimeGraph
│   │   ├── hooks/
│   │   │   ├── useClock.ts         1s live clock
│   │   │   └── useLiveMetrics.ts   WebSocket stream + auto-reconnect
│   │   ├── pages/
│   │   │   ├── OverviewPage        Dashboard: CPU/RAM/net live + history
│   │   │   ├── DockerPage          Container list + start/stop/restart
│   │   │   ├── ProcessesPage       Top 25 processes by CPU + kill
│   │   │   ├── NetworkPage         Interface cards + DNS + connections
│   │   │   ├── StoragePage         Disk partitions + I/O stats
│   │   │   ├── LogsPage            Journald log viewer + filter
│   │   │   └── ApplicationsPage    Docker App Store (Fase 3)
│   │   ├── stores/ui.ts            Zustand: active page, sidebar state
│   │   ├── types/                  TypeScript interfaces (all)
│   │   └── utils/tokens.ts         Design tokens + formatters
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
│
└── scripts/
    ├── install.sh          ← MAIN INSTALLER (run this)
    ├── uninstall.sh        ← Remove NexOS
    ├── update.sh           ← Update in-place
    ├── nexos-ctl.sh        ← CLI management tool
    ├── nexos-api.service   ← systemd unit (API)
    └── nexos-ui.service    ← systemd unit (UI static serve)
```

---

## API Reference

### System  `/api/v1/system`
| Endpoint | Description |
|----------|-------------|
| `GET /`  | Full snapshot: CPU, RAM, disk, host, uptime |
| `GET /cpu` | CPU usage + model + cores |
| `GET /memory` | RAM + swap breakdown |
| `GET /disk` | Partitions + I/O counters |
| `GET /uptime` | Uptime in seconds + human string |
| `GET /host` | Hostname, OS, kernel, arch |

### Docker  `/api/v1/docker`
| Endpoint | Description |
|----------|-------------|
| `GET /` | Docker info + all containers |
| `GET /containers` | Container list (`?all=true`) |
| `GET /containers/:id/stats` | CPU/RAM/net per container |
| `GET /containers/:id/logs` | Logs (`?tail=100`) |
| `POST /containers/:id/start` | Start |
| `POST /containers/:id/stop` | Stop |
| `POST /containers/:id/restart` | Restart |
| `DELETE /containers/:id` | Remove (`?force=true`) |
| `GET /images` | Image list with sizes |
| `GET /volumes` | Volume list |

### Network  `/api/v1/network`
| Endpoint | Description |
|----------|-------------|
| `GET /` | All interfaces + IP + live speed |
| `GET /stats` | Speed from `/proc/net/dev` |
| `GET /interfaces` | IP addresses per interface |
| `GET /connections` | TCP connection count |
| `GET /dns` | DNS servers from resolv.conf |

### Processes  `/api/v1/processes`
| Endpoint | Description |
|----------|-------------|
| `GET /` | Top 20 processes by CPU |
| `GET /top` | Top N (`?limit=N`) |
| `DELETE /:pid` | Kill process (`?signal=SIGKILL`) |

### Logs  `/api/v1/logs`
| Endpoint | Description |
|----------|-------------|
| `GET /` | Journald (`?lines=100&unit=nginx&priority=3`) |
| `GET /kernel` | dmesg ring buffer |
| `GET /auth` | /var/log/auth.log |
| `GET /units` | Active systemd units |

### App Store  `/api/v1/apps`
| Endpoint | Description |
|----------|-------------|
| `GET /` | Catalog (`?category=monitoring&search=grafana&sort=stars`) |
| `GET /installed` | Installed apps |
| `GET /:id` | App detail |
| `GET /:id/status` | Container runtime status |
| `POST /:id/deploy` | Deploy via `docker compose up -d` |
| `POST /:id/stop` | Stop all containers |
| `DELETE /:id` | Remove (`?volumes=true`) |

### WebSocket  `ws://host:3001/api/v1/stream/metrics`
Pushes JSON every 1 second:
```json
{
  "ts": 1716200000000,
  "cpu":  { "usage": 38, "iowait": 2 },
  "ram":  { "percent": 61, "used": 4096, "total": 8192 },
  "swap": { "percent": 22 },
  "net":  [{ "interface": "eth0", "rx_speed_mb": "12.40", "tx_speed_mb": "3.10" }]
}
```

---

## Service Management

```bash
# Status
systemctl status nexos-api nexos-ui

# Logs (live)
journalctl -u nexos-api -f
journalctl -u nexos-ui  -f

# Quick tool (after install)
nexos-ctl status
nexos-ctl restart
nexos-ctl health
nexos-ctl logs-api

# Config
nano /opt/nexos/api/.env
nano /opt/nexos/ui/.env

# Update
sudo bash /opt/nexos/scripts/update.sh

# Uninstall
sudo bash /opt/nexos/scripts/uninstall.sh
```

---

## App Catalog

15 apps across 9 categories, ready to deploy:

| App | Category | RAM | Ports |
|-----|----------|-----|-------|
| Portainer | Infrastructure | 128MB | 9000, 9443 |
| Nginx Proxy Manager | Networking | 256MB | 80, 443, 81 |
| Grafana | Monitoring | 512MB | 3000 |
| Vaultwarden | Security | 64MB | 8880 |
| Uptime Kuma | Monitoring | 256MB | 3001 |
| Nextcloud | Productivity | 1GB | 8080 |
| Jellyfin | Media | 1GB | 8096 |
| Home Assistant | IoT | 512MB | 8123 |
| AdGuard Home | Networking | 128MB | 53, 8080 |
| Gitea | Development | 256MB | 3030 |
| Immich | Media | 2GB | 2283 |
| n8n | Automation | 512MB | 5678 |
| WireGuard Easy | Networking | 64MB | 51820/udp |
| VS Code Server | Development | 1GB | 8443 |
| File Browser | Productivity | 64MB | 8088 |

Add custom apps by editing `api/src/catalog/apps.json` — no restart needed.

---

## Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 512MB | 1GB+ |
| Disk | 2GB | 10GB+ |
| CPU | 1 core | 2+ cores |
| OS | Debian 12 / Ubuntu 22+ | Debian 12 Bookworm |
| Node.js | 18 | 20 LTS |
| Docker | 24+ (optional) | 26+ |

---

## Troubleshooting

**API won't start**
```bash
journalctl -u nexos-api -n 50 --no-pager
# Common: port already in use → change PORT in /opt/nexos/api/.env
```

**UI shows "Cannot connect to API"**
```bash
# Check VITE_API_URL in /opt/nexos/ui/.env matches the server IP
cat /opt/nexos/ui/.env
# Rebuild after changing:
cd /opt/nexos/ui && npm run build
systemctl restart nexos-ui
```

**Docker features not working in LXC**
See Proxmox LXC Notes above — enable nesting=1 or bind-mount Docker socket.

**App Store deploy fails**
```bash
# Verify docker compose is available
docker compose version
# Check stack logs
docker compose -f /opt/nexos/api/src/stacks/<appid>/docker-compose.yml logs
```
