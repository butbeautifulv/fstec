#!/bin/sh
set -eu

USER="${POSTGRES_USER:-fstec}"
PASS="${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}"
LISTEN_PORT="${PGBOUNCER_LISTEN_PORT:-6432}"
CONFIG_SRC="${PGBOUNCER_CONFIG:-/etc/pgbouncer/pgbouncer.ini}"

mkdir -p /etc/pgbouncer/runtime
printf '"%s" "%s"\n' "$USER" "$PASS" > /etc/pgbouncer/userlist.txt
printf '"pgbouncer" "%s"\n' "$PASS" >> /etc/pgbouncer/userlist.txt

sed "s/listen_port = 6432/listen_port = ${LISTEN_PORT}/" "$CONFIG_SRC" \
  | sed "s/listen_port = 6433/listen_port = ${LISTEN_PORT}/" \
  > /etc/pgbouncer/runtime/pgbouncer.ini

exec pgbouncer /etc/pgbouncer/runtime/pgbouncer.ini
