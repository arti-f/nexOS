#!/usr/bin/env bash
# NexOS Uninstaller
set -euo pipefail
[[ $EUID -ne 0 ]] && echo "Run as root" && exit 1

INSTALL_DIR=${1:-/opt/nexos}

echo "Stopping services..."
systemctl stop nexos-api nexos-ui 2>/dev/null || true
systemctl disable nexos-api nexos-ui 2>/dev/null || true

echo "Removing service files..."
rm -f /etc/systemd/system/nexos-api.service
rm -f /etc/systemd/system/nexos-ui.service
systemctl daemon-reload

echo "Removing installation directory: $INSTALL_DIR"
rm -rf "$INSTALL_DIR"

echo "Removing nexos user..."
userdel nexos 2>/dev/null || true

echo ""
echo "✓ NexOS uninstalled."
echo "  Docker and Node.js were NOT removed — uninstall manually if needed."
