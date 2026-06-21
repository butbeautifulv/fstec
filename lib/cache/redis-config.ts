const DEFAULT_DASHBOARD_CACHE_TTL_SECONDS = 300
const DEFAULT_REFERENCE_CACHE_TTL_SECONDS = 900

function parseTtlSeconds(
  envValue: string | undefined,
  fallback: number
): number {
  const parsed = Number(envValue)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getDashboardCacheTtl(): number {
  return parseTtlSeconds(
    process.env.DASHBOARD_CACHE_TTL_SECONDS,
    DEFAULT_DASHBOARD_CACHE_TTL_SECONDS
  )
}

export function getReferenceCacheTtl(): number {
  return parseTtlSeconds(
    process.env.REFERENCE_CACHE_TTL_SECONDS,
    DEFAULT_REFERENCE_CACHE_TTL_SECONDS
  )
}

export function isRedisEnabled(): boolean {
  if (process.env.REDIS_URL?.trim()) return true
  return Boolean(
    process.env.REDIS_SENTINELS?.trim() && process.env.REDIS_MASTER_NAME?.trim()
  )
}
