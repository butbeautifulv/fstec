import "server-only"

import { cache } from "react"
import { getCachedJson, invalidateKeys } from "@/lib/cache/json-cache"
import { getDashboardCacheTtl } from "@/lib/cache/redis"
import type { DashboardMatrixQuery } from "@/lib/dashboard/dashboard-query"
import { getScopedDashboardItemsSerialized } from "@/lib/dashboard/get-scoped-dashboard"
import { getScopedDashboardStats } from "@/lib/dashboard/get-scoped-dashboard"
import {
  dashboardCacheKey,
  dashboardStatsCacheKey,
} from "@/lib/dashboard/scope-key"
import type { SerializedMatrixItem } from "@/lib/dashboard/serialize-dashboard"
import type { DashboardScope, ScopedDashboardStats } from "@/lib/dashboard/stats"

async function loadCachedScopedDashboardStats(
  scope: DashboardScope
): Promise<ScopedDashboardStats> {
  const key = dashboardStatsCacheKey(scope)
  const ttl = getDashboardCacheTtl()

  return getCachedJson(key, ttl, () => getScopedDashboardStats(scope))
}

export const getCachedScopedDashboardStats = cache((scope: DashboardScope) =>
  loadCachedScopedDashboardStats(scope)
)

export async function getScopedDashboardItems(
  scope: DashboardScope,
  query: DashboardMatrixQuery
): Promise<SerializedMatrixItem[]> {
  return getScopedDashboardItemsSerialized(scope, query)
}

/** @deprecated Use getCachedScopedDashboardStats + getScopedDashboardItems */
export async function getCachedScopedDashboard(
  scope: DashboardScope,
  options?: { limit?: number }
) {
  const query: DashboardMatrixQuery = { overdueOnly: false }
  const [stats, items] = await Promise.all([
    getCachedScopedDashboardStats(scope),
    getScopedDashboardItems(scope, query),
  ])

  if (options?.limit != null && options.limit > 0) {
    return { stats, items: items.slice(0, options.limit) }
  }

  return { stats, items }
}

export async function invalidateDashboardCache(scope?: DashboardScope): Promise<void> {
  const keys = [
    "dashboard:global",
    "dashboard:stats:global",
  ]
  if (scope) {
    keys.push(dashboardCacheKey(scope), dashboardStatsCacheKey(scope))
  }
  await invalidateKeys(...keys)
}
