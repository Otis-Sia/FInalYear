#!/bin/bash
set -e

# Configuration
IP="192.168.100.242"
SSL_DIR="/etc/nginx/ssl"
KEY_FILE="$SSL_DIR/nginx-selfsigned.key"
CERT_FILE="$SSL_DIR/nginx-selfsigned.crt"
CONFIG_FILE="openssl-san.cnf"

# Create OpenSSL config file with SAN
cat > $CONFIG_FILE <<EOF
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

# Generate key and certificate
# We use sudo here because /etc/nginx/ssl/ is usually root-owned
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config "$CONFIG_FILE"

echo "Certificate regenerated at $CERT_FILE"
echo "Key regenerated at $KEY_FILE"

# Clean up config file
rm $CONFIG_FILE

# Test Nginx config
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Done! You can now access https://$IP"
