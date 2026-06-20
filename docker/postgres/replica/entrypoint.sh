#!/bin/sh
set -eu

PRIMARY_HOST="${POSTGRES_PRIMARY_HOST:-db-primary}"
PRIMARY_PORT="${POSTGRES_PRIMARY_PORT:-5432}"
REPL_USER="${POSTGRES_REPLICATION_USER:-replicator}"
REPL_PASSWORD="${POSTGRES_REPLICATION_PASSWORD:?set POSTGRES_REPLICATION_PASSWORD}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

if [ -s "$PGDATA/PG_VERSION" ]; then
  echo "Replica data directory exists — starting postgres standby."
  exec /usr/local/bin/docker-entrypoint.sh postgres
fi

echo "Waiting for primary at ${PRIMARY_HOST}:${PRIMARY_PORT}..."
until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 2
done

echo "Cloning primary with pg_basebackup..."
export PGPASSWORD="$REPL_PASSWORD"
rm -rf "$PGDATA"/*
pg_basebackup \
  -h "$PRIMARY_HOST" \
  -p "$PRIMARY_PORT" \
  -U "$REPL_USER" \
  -D "$PGDATA" \
  -Fp \
  -Xs \
  -P \
  -R

touch "$PGDATA/standby.signal"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

echo "Replica clone complete — starting postgres."
exec /usr/local/bin/docker-entrypoint.sh postgres
