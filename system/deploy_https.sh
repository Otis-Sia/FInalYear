#!/bin/bash
set -e

# Wrapper to generate certs (self-signed by default) and install nginx site
# Usage: sudo ./system/deploy_https.sh [host|detect]

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GENERATE_SCRIPT="$REPO_ROOT/system/generate_cert.sh"
TEMPLATE="$REPO_ROOT/deploy/nginx/attendance.conf"
PORT="${PORT:-3000}"
HOST_PARAM="${1:-detect}"

if [ ! -f "$GENERATE_SCRIPT" ]; then
  echo "generate_cert.sh not found at $GENERATE_SCRIPT" >&2
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "nginx template not found at $TEMPLATE" >&2
  exit 1
fi

echo "Generating certificate for host: $HOST_PARAM"
sudo bash "$GENERATE_SCRIPT" "$HOST_PARAM"

# Prepare nginx site with correct port
TMP_CONF=$(mktemp /tmp/attendance-nginx-XXXX.conf)
sed "s|__PORT__|$PORT|g" "$TEMPLATE" > "$TMP_CONF"

echo "Installing nginx site..."
sudo mkdir -p /etc/nginx/sites-available
sudo mv "$TMP_CONF" /etc/nginx/sites-available/attendance
sudo ln -sf /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/attendance
sudo chown root:root /etc/nginx/sites-available/attendance

echo "Setting permissions for SSL files..."
sudo chmod 644 /etc/nginx/ssl/attendance.crt || true
sudo chmod 600 /etc/nginx/ssl/attendance.key || true

echo "Testing nginx configuration..."
sudo nginx -t

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "HTTPS site deployed (proxied to port $PORT)."
