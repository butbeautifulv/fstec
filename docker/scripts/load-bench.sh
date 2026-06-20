#!/usr/bin/env sh
# Quick load comparison helper — run after prod stack is up.
set -eu

HEY="${HEY:-$HOME/go/bin/hey}"
BASE="${BASE:-https://localhost:8443}"
DURATION="${DURATION:-15s}"
CONCURRENCY="${CONCURRENCY:-40}"

if [ ! -x "$HEY" ]; then
  echo "hey not found at $HEY — run: go install github.com/rakyll/hey@latest" >&2
  exit 1
fi

bench() {
  name="$1"
  path="$2"
  echo ""
  echo "=== $name ($path) ==="
  "$HEY" -z "$DURATION" -c "$CONCURRENCY" -k "$BASE$path" 2>&1 | grep -E '^(Summary:|  Total:|  Requests/sec:|  Average:|  Fastest:|  Slowest:|  Status code distribution:|[0-9]+ )' || true
}

echo "Load test: duration=$DURATION concurrency=$CONCURRENCY base=$BASE"
bench "Login (static SSR)" "/login"
bench "Public dashboard (DB + cache)" "/p/dev-rost"
