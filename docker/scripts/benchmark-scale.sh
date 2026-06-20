#!/usr/bin/env sh
# Benchmark SCALE_TIER=0 vs SCALE_TIER=3 (direct app + optional nginx).
set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
RESULTS_DIR="$ROOT/docker/benchmark-results"
RESULTS_FILE="$RESULTS_DIR/latest.txt"
DURATION="${DURATION:-30}"
CONCURRENCY="${CONCURRENCY:-20}"
NGINX_CONCURRENCY="${NGINX_CONCURRENCY:-8}"

mkdir -p "$RESULTS_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

run_autocannon() {
  target="$1"
  path="$2"
  docker run --rm --network fstec-prod_internal node:22-alpine sh -c \
    "npx --yes autocannon@7 -d $DURATION -c $CONCURRENCY --renderStatusCodes '${target}${path}'"
}

extract_stats() {
  awk '
    /Latency.*\|/ { getline; if ($0 ~ /\|/) { for (i=1;i<=NF;i++) if ($(i+1) ~ /ms$/) { print "p50=" $(i+1); break } } }
    /Req\/Sec.*\|/ { getline; if ($0 ~ /\|/) { for (i=1;i<=NF;i++) if ($i ~ /^[0-9]+/ && $(i+1) ~ /^[0-9]+/) { print "rps=" $(i+1); break } } }
    /│ 200/ { getline; if ($0 ~ /│/) { gsub(/[^0-9]/,"",$2); print "ok="$2 } }
  '
}

bench_tier() {
  tier="$1"
  label="$2"
  echo ""
  echo "=== Deploying SCALE_TIER=$tier ($label) ==="
  SCALE_TIER="$tier" ENV_FILE="$ENV_FILE" sh "$ROOT/docker/scripts/prod-scale.sh" -d 2>&1 | tail -5
  sleep 12

  if [ "$tier" -eq 0 ]; then
    docker compose -f "$ROOT/docker-compose.prod.yml" -f "$ROOT/docker-compose.ha.yml" \
      --env-file "$ENV_FILE" --profile single --profile seed-single run --rm seed 2>&1 | tail -2 || true
  else
    docker compose -f "$ROOT/docker-compose.prod.yml" -f "$ROOT/docker-compose.ha.yml" \
      --env-file "$ENV_FILE" --profile ha --profile seed-ha run --rm seed-ha 2>&1 | tail -2 || true
  fi

  docker run --rm --network fstec-prod_internal curlimages/curl:latest -sf \
    "http://app:3000/login" > /dev/null || true
  docker run --rm --network fstec-prod_internal curlimages/curl:latest -sf \
    "http://app:3000/p/dev-rost" > /dev/null || true

  for path in /login /p/dev-rost; do
    echo ""
    echo "--- direct app:3000 $path (tier $tier) ---"
    output="$(run_autocannon "http://app:3000" "$path")"
    echo "$output" | tail -20
    stats="$(echo "$output" | extract_stats | tr '\n' ' ')"
    echo "STATS|tier=$tier|direct|$path|$stats"
    echo "tier=$tier|direct|$path|$stats" >> "$RESULTS_FILE.tmp"
  done
}

bench_nginx_tier() {
  tier="$1"
  echo ""
  echo "=== nginx HTTPS tier $tier (NGINX_BENCH_MODE=1) ==="
  NGINX_BENCH_MODE=1 SCALE_TIER="$tier" ENV_FILE="$ENV_FILE" \
    sh "$ROOT/docker/scripts/prod-scale.sh" --build -d 2>&1 | tail -5
  sleep 10

  for path in /login /p/dev-rost; do
    echo ""
    echo "--- nginx :8443 $path (tier $tier) ---"
    output="$(NODE_TLS_REJECT_UNAUTHORIZED=0 npx --yes autocannon@7 \
      -d "$DURATION" -c "$NGINX_CONCURRENCY" --renderStatusCodes \
      "https://localhost:8443$path" 2>/dev/null)"
    echo "$output" | tail -20
    stats="$(echo "$output" | extract_stats | tr '\n' ' ')"
    echo "tier=$tier|nginx|$path|$stats" >> "$RESULTS_FILE.tmp"
  done
}

: > "$RESULTS_FILE.tmp"
{
  echo "# FSTEC scale benchmark $(date -Iseconds)"
  echo "duration=${DURATION}s concurrency=${CONCURRENCY}"
  echo ""
} > "$RESULTS_FILE"

bench_tier 0 "single-node 1 app"
bench_tier 3 "HA 8 app"

bench_nginx_tier 0
bench_nginx_tier 3

{
  echo ""
  echo "## Summary"
  echo "| Tier | Path | Mode | Stats |"
  echo "|------|------|------|-------|"
  while IFS='|' read -r tier mode path stats; do
    echo "| ${tier#tier=} | $path | $mode | $stats |"
  done < "$RESULTS_FILE.tmp"
} >> "$RESULTS_FILE"

rm -f "$RESULTS_FILE.tmp"
echo ""
echo "Results written to $RESULTS_FILE"
cat "$RESULTS_FILE"
