#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  NexOS Installer — Debian 12 / Ubuntu 22-24 / Arch / Fedora    ║
# ║  Tested on: Debian 12 Bookworm (LXC Proxmox)                   ║
# ║  Usage:  sudo bash install.sh [--port-ui 3000] [--port-api 3001]║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─── Colour helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[nexos]${NC} $*"; }
ok()      { echo -e "${GREEN}[  ok ]${NC} $*"; }
warn()    { echo -e "${YELLOW}[ warn]${NC} $*"; }
err()     { echo -e "${RED}[fail ]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══ $* ══${NC}"; }

# ─── Defaults ────────────────────────────────────────────────────────────────
PORT_API=3001
PORT_UI=3000
INSTALL_DIR=/opt/nexos
NEXOS_USER=nexos
MIN_NODE=18
SKIP_DOCKER=false
SKIP_BUILD=false

# ─── Parse args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-ui)    PORT_UI="$2";    shift 2 ;;
    --port-api)   PORT_API="$2";   shift 2 ;;
    --dir)        INSTALL_DIR="$2"; shift 2 ;;
    --skip-docker) SKIP_DOCKER=true; shift ;;
    --skip-build)  SKIP_BUILD=true;  shift ;;
    --help|-h)
      echo "Usage: sudo bash install.sh [options]"
      echo "  --port-ui   N    Frontend port    (default 3000)"
      echo "  --port-api  N    API port         (default 3001)"
      echo "  --dir       PATH Install directory (default /opt/nexos)"
      echo "  --skip-docker    Skip Docker install"
      echo "  --skip-build     Skip npm build (use pre-built dist)"
      exit 0 ;;
    *) warn "Unknown option: $1"; shift ;;
  esac
done

# ─── Root check ──────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root:  sudo bash install.sh"

# ─── Detect distro ───────────────────────────────────────────────────────────
step "Detecting system"
if   [[ -f /etc/debian_version ]]; then
  DISTRO=debian
  CODENAME=$(grep VERSION_CODENAME /etc/os-release | cut -d= -f2)
  info "Debian/Ubuntu detected — codename: ${CODENAME}"
elif [[ -f /etc/arch-release ]]; then
  DISTRO=arch
elif grep -q "Fedora\|RHEL\|CentOS\|Rocky" /etc/os-release 2>/dev/null; then
  DISTRO=fedora
else
  err "Unsupported distro. Install Node.js 20+ and Docker manually, then re-run."
fi

# ─── Detect LXC / Proxmox ────────────────────────────────────────────────────
IS_LXC=false
if [[ -f /proc/1/environ ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
  IS_LXC=true
  warn "LXC container detected — Docker install will be skipped."
  warn "Make sure Docker is available on the Proxmox host and bind-mounted,"
  warn "OR install Docker on an LXC with nesting+keyctl enabled."
  SKIP_DOCKER=true
elif systemd-detect-virt --container 2>/dev/null | grep -q lxc; then
  IS_LXC=true
  SKIP_DOCKER=true
  warn "LXC detected — skipping Docker install."
fi

# ─── System update ───────────────────────────────────────────────────────────
step "Updating system packages"
case $DISTRO in
  debian) apt-get update -qq && apt-get install -y -qq curl wget git ca-certificates gnupg lsb-release ;;
  arch)   pacman -Syu --noconfirm --needed curl wget git ca-certificates ;;
  fedora) dnf install -y -q curl wget git ca-certificates ;;
esac
ok "System packages ready"

# ─── Node.js 20 ──────────────────────────────────────────────────────────────
step "Installing Node.js 20"

node_ok=false
if command -v node &>/dev/null; then
  CURRENT_NODE=$(node -e 'process.stdout.write(process.version.slice(1).split(".")[0])')
  if [[ $CURRENT_NODE -ge $MIN_NODE ]]; then
    ok "Node.js $(node -v) already installed"
    node_ok=true
  fi
fi

if [[ $node_ok == false ]]; then
  case $DISTRO in
    debian)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
      apt-get install -y nodejs >/dev/null 2>&1
      ;;
    arch)
      pacman -Sy --noconfirm nodejs npm >/dev/null 2>&1
      ;;
    fedora)
      dnf module enable nodejs:20 -y >/dev/null 2>&1 || true
      dnf install -y nodejs npm >/dev/null 2>&1
      ;;
  esac
  ok "Node.js $(node -v) installed"
fi

# ─── Docker ──────────────────────────────────────────────────────────────────
if [[ $SKIP_DOCKER == false ]]; then
  step "Installing Docker"
  if command -v docker &>/dev/null; then
    ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') already installed"
  else
    case $DISTRO in
      debian)
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg \
          | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
          https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
          > /etc/apt/sources.list.d/docker.list
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        ;;
      arch)
        pacman -Sy --noconfirm docker docker-compose
        ;;
      fedora)
        dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo -y
        dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        ;;
    esac
    systemctl enable docker
    systemctl start docker
    ok "Docker installed and started"
  fi
fi

# ─── Create nexos user ───────────────────────────────────────────────────────
step "Setting up nexos user"
if ! id "$NEXOS_USER" &>/dev/null; then
  useradd -r -s /bin/false -d "$INSTALL_DIR" -m "$NEXOS_USER"
  ok "User $NEXOS_USER created"
else
  ok "User $NEXOS_USER already exists"
fi

# Add to docker group if docker is available
if command -v docker &>/dev/null; then
  usermod -aG docker "$NEXOS_USER" 2>/dev/null || true
  ok "Added $NEXOS_USER to docker group"
fi

# ─── Install NexOS files ─────────────────────────────────────────────────────
step "Installing NexOS to $INSTALL_DIR"

# Determine source directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$INSTALL_DIR"

# Copy API
info "Copying API..."
cp -r "$SOURCE_DIR/api" "$INSTALL_DIR/"
mkdir -p "$INSTALL_DIR/api/src/data"
mkdir -p "$INSTALL_DIR/api/src/stacks"

# Copy UI
info "Copying UI source..."
cp -r "$SOURCE_DIR/ui" "$INSTALL_DIR/"

# ─── Configure .env files ────────────────────────────────────────────────────
step "Writing configuration"

# API .env
cat > "$INSTALL_DIR/api/.env" << ENVEOF
PORT=$PORT_API
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=*
DOCKER_SOCKET=/var/run/docker.sock
ENVEOF
ok "API .env written (port $PORT_API)"

# UI .env — use server's primary IP
SERVER_IP=$(hostname -I | awk '{print $1}')
cat > "$INSTALL_DIR/ui/.env" << ENVEOF
VITE_API_URL=http://${SERVER_IP}:${PORT_API}
ENVEOF
ok "UI .env written (API → http://${SERVER_IP}:${PORT_API})"

# ─── Install Node dependencies ───────────────────────────────────────────────
step "Installing Node.js dependencies"

info "API deps..."
cd "$INSTALL_DIR/api"
npm install --omit=dev --silent
ok "API dependencies installed"

info "UI deps..."
cd "$INSTALL_DIR/ui"
npm install --silent
ok "UI dependencies installed"

# ─── Build UI ────────────────────────────────────────────────────────────────
if [[ $SKIP_BUILD == false ]]; then
  step "Building UI (React → static files)"
  cd "$INSTALL_DIR/ui"
  npm run build
  ok "UI built → $INSTALL_DIR/ui/dist"
else
  info "Skipping UI build (--skip-build)"
fi

# ─── Install serve for static hosting ────────────────────────────────────────
step "Installing static file server"
npm install -g serve --silent 2>/dev/null || true
ok "serve installed globally"

# ─── Fix permissions ─────────────────────────────────────────────────────────
step "Setting permissions"
chown -R "$NEXOS_USER:$NEXOS_USER" "$INSTALL_DIR"
chmod 700 "$INSTALL_DIR/api/src/data"
chmod 700 "$INSTALL_DIR/api/src/stacks"
ok "Permissions set"

# ─── Install systemd services ────────────────────────────────────────────────
step "Installing systemd services"

# Patch service files with actual install dir and ports
sed \
  -e "s|/opt/nexos|$INSTALL_DIR|g" \
  -e "s|-p 3000|-p $PORT_UI|g" \
  -e "s|-p 3001|-p $PORT_API|g" \
  "$SOURCE_DIR/scripts/nexos-api.service" > /etc/systemd/system/nexos-api.service

sed \
  -e "s|/opt/nexos|$INSTALL_DIR|g" \
  -e "s|-p 3000|-p $PORT_UI|g" \
  "$SOURCE_DIR/scripts/nexos-ui.service" > /etc/systemd/system/nexos-ui.service

systemctl daemon-reload
systemctl enable nexos-api nexos-ui
systemctl restart nexos-api nexos-ui

ok "Services installed and started"

# ─── Firewall hints ──────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow "$PORT_UI/tcp" >/dev/null 2>&1 || true
  ufw allow "$PORT_API/tcp" >/dev/null 2>&1 || true
  info "ufw rules added for ports $PORT_UI and $PORT_API"
fi

# ─── Health check ────────────────────────────────────────────────────────────
step "Verifying installation"
sleep 3

API_OK=false
UI_OK=false

if curl -sf "http://127.0.0.1:${PORT_API}/health" >/dev/null 2>&1; then
  API_OK=true
fi
if curl -sf "http://127.0.0.1:${PORT_UI}" >/dev/null 2>&1; then
  UI_OK=true
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║           NexOS installed successfully!              ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Dashboard UI${NC}   http://${SERVER_IP}:${PORT_UI}"
echo -e "  ${BOLD}API${NC}            http://${SERVER_IP}:${PORT_API}"
echo -e "  ${BOLD}API Health${NC}     http://${SERVER_IP}:${PORT_API}/health"
echo ""
echo -e "  API status:  $( [[ $API_OK == true ]] && echo -e "${GREEN}● running${NC}" || echo -e "${YELLOW}○ starting (check: journalctl -u nexos-api -f)${NC}")"
echo -e "  UI  status:  $( [[ $UI_OK == true ]]  && echo -e "${GREEN}● running${NC}" || echo -e "${YELLOW}○ starting (check: journalctl -u nexos-ui -f)${NC}")"
echo ""
echo -e "  ${BOLD}Manage:${NC}"
echo -e "  systemctl status nexos-api nexos-ui"
echo -e "  journalctl -u nexos-api -f"
echo -e "  journalctl -u nexos-ui  -f"
echo ""
if [[ $IS_LXC == true ]]; then
  echo -e "  ${YELLOW}LXC note:${NC} Docker socket not available in this container."
  echo -e "  Docker features (App Store deploy, container management) require:"
  echo -e "  1. LXC with nesting=1 + keyctl=1 in Proxmox CT options, OR"
  echo -e "  2. Bind-mount /var/run/docker.sock from Proxmox host:"
  echo -e "     Add to /etc/pve/lxc/<ctid>.conf:"
  echo -e "     lxc.mount.entry: /var/run/docker.sock var/run/docker.sock none bind,create=file 0 0"
  echo ""
fi
echo -e "  ${BOLD}Config files:${NC}"
echo -e "  ${INSTALL_DIR}/api/.env"
echo -e "  ${INSTALL_DIR}/ui/.env"
echo ""
