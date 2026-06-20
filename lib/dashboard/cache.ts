import { DASHBOARD_CACHE_TTL_SECONDS, getRedis } from "@/lib/cache/redis"
import { getScopedDashboard } from "@/lib/dashboard/get-scoped-dashboard"
import { dashboardCacheKey } from "@/lib/dashboard/scope-key"
import {
  serializeDashboardDto,
  type SerializedDashboardDto,
} from "@/lib/dashboard/serialize-dashboard"
import type { DashboardScope } from "@/lib/dashboard/stats"

export async function getCachedScopedDashboard(
  scope: DashboardScope
): Promise<SerializedDashboardDto> {
  const redis = getRedis()
  const key = dashboardCacheKey(scope)

  if (redis) {
    try {
      const cached = await redis.get(key)
      if (cached) return JSON.parse(cached) as SerializedDashboardDto
    } catch {
      // Fall through to DB on cache read errors.
    }
  }

  const data = await getScopedDashboard(scope)
  const serialized = serializeDashboardDto(data)

  if (redis) {
    try {
      await redis.setex(key, DASHBOARD_CACHE_TTL_SECONDS, JSON.stringify(serialized))
    } catch {
      // Ignore cache write errors.
    }
  }

  return serialized
}

export async function invalidateDashboardCache(scope?: DashboardScope): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  const keys = ["dashboard:global"]
  if (scope) keys.push(dashboardCacheKey(scope))

  try {
    await redis.del(...keys)
  } catch {
    // Ignore cache invalidation errors.
  }
}
