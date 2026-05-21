#!/usr/bin/env bash
# NexOS Update — pull latest files and rebuild UI
set -euo pipefail
[[ $EUID -ne 0 ]] && echo "Run as root" && exit 1

INSTALL_DIR=${1:-/opt/nexos}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

echo "[nexos] Stopping services..."
systemctl stop nexos-api nexos-ui

echo "[nexos] Copying updated files..."
cp -r "$SOURCE_DIR/api/src" "$INSTALL_DIR/api/"
cp -r "$SOURCE_DIR/ui/src"  "$INSTALL_DIR/ui/"

echo "[nexos] Updating API dependencies..."
cd "$INSTALL_DIR/api" && npm install --omit=dev --silent

echo "[nexos] Rebuilding UI..."
cd "$INSTALL_DIR/ui"  && npm install --silent && npm run build

chown -R nexos:nexos "$INSTALL_DIR"

echo "[nexos] Restarting services..."
systemctl start nexos-api nexos-ui

echo "[nexos] ✓ Update complete."
systemctl status nexos-api nexos-ui --no-pager -l
