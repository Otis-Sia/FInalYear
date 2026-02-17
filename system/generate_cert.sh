#!/bin/bash
set -e

# Configuration
SSL_DIR="/etc/nginx/ssl"
# By default use attendance.* filenames
KEY_FILE="$SSL_DIR/attendance.key"
CERT_FILE="$SSL_DIR/attendance.crt"

# Usage: ./generate_cert.sh [host|detect]
# If no host provided or host is 'detect', the script will auto-detect the primary LAN IP.
CONFIG_FILE=""

parse_args() {
  # Accept first arg as host, or use env HOST. 'detect' forces auto-detection.
  HOST_ARG="$1"
  if [ -n "$HOST_ARG" ]; then
    HOST="$HOST_ARG"
  elif [ -n "$HOST" ]; then
    HOST="$HOST"
  else
    HOST="detect"
  fi
}

detect_ip() {
  # Try to detect primary non-loopback IPv4 address
  IP_ADDR=""
  if command -v ip >/dev/null 2>&1; then
    IP_ADDR=$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ { for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}')
  fi
  if [ -z "$IP_ADDR" ]; then
    IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [ -z "$IP_ADDR" ]; then
    echo "Unable to detect LAN IP. Please provide a host/IP as an argument." >&2
    exit 1
  fi
  echo "$IP_ADDR"
}

main() {
  parse_args "$1"

  if [ "$HOST" = "detect" ]; then
    IP=$(detect_ip)
  else
    IP="$HOST"
  fi

  # Ensure SSL directory exists
  sudo mkdir -p "$SSL_DIR"
  sudo chown root:root "$SSL_DIR"
  sudo chmod 755 "$SSL_DIR"

  # Create temporary OpenSSL config file with SAN
  CONFIG_FILE=$(mktemp /tmp/openssl-san-XXXX.cnf)
  cat > "$CONFIG_FILE" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext
x509_extensions = v3_req

[dn]
C = KE
ST = Nairobi
L = Nairobi
O = Sia
OU = Sia
CN = $IP

[req_ext]
subjectAltName = @alt_names

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = $IP
EOF

echo "Generating new self-signed certificate with SAN IP: $IP"

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config "$CONFIG_FILE"

echo "Certificate generated at $CERT_FILE"
echo "Key generated at $KEY_FILE"

# Clean up config file
rm -f "$CONFIG_FILE"

# Set safe permissions
sudo chmod 600 "$KEY_FILE" || true
sudo chmod 644 "$CERT_FILE" || true

# Test and restart Nginx
echo "Testing Nginx configuration..."
sudo nginx -t

echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Done! You can now access https://$IP"
}

main "$1"
