#!/bin/sh
set -eu

cat >> "$PGDATA/pg_hba.conf" <<EOF
host replication replicator 0.0.0.0/0 trust
host replication replicator ::0/0 trust
EOF
