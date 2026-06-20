#!/usr/bin/env sh
set -eu

SSL_DIR="$(cd "$(dirname "$0")/../nginx/ssl" && pwd)"
mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
  echo "TLS certs already exist in $SSL_DIR — skipping generation."
  exit 0
fi

CN="${CERT_CN:-localhost}"
echo "Generating self-signed TLS cert (CN=$CN)…"
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/CN=${CN}/O=FSTEC" \
  -addext "subjectAltName=DNS:${CN},DNS:localhost,DNS:fstec.local,IP:127.0.0.1"

chmod 644 "$SSL_DIR/fullchain.pem"
# nginx-unprivileged (uid 101) must read the mounted key in Docker
chmod 644 "$SSL_DIR/privkey.pem"

echo "Done: $SSL_DIR/fullchain.pem"
