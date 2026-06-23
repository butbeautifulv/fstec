import "server-only"

import { cache } from "react"
import { getCachedJson, invalidateKeysByPrefix } from "@/lib/cache/json-cache"
import { getDashboardCacheTtl } from "@/lib/cache/redis"
import { getScopedDashboard } from "@/lib/dashboard/get-scoped-dashboard"
import { dashboardCacheKey } from "@/lib/dashboard/scope-key"
import {
  serializeDashboardDto,
  type SerializedDashboardDto,
} from "@/lib/dashboard/serialize-dashboard"
import type { DashboardScope } from "@/lib/dashboard/stats"

type GetCachedScopedDashboardOptions = {
  limit?: number
}

async function loadCachedScopedDashboard(
  scope: DashboardScope,
  options?: GetCachedScopedDashboardOptions
): Promise<SerializedDashboardDto> {
  const key = dashboardCacheKey(scope)
  const ttl = getDashboardCacheTtl()

  const full = await getCachedJson(key, ttl, async () => {
    const data = await getScopedDashboard(scope)
    return serializeDashboardDto(data)
  })

  if (options?.limit != null && options.limit > 0) {
    return {
      ...full,
      items: full.items.slice(0, options.limit),
    }
  }

  return full
}

export const getCachedScopedDashboard = cache(
  (scope: DashboardScope, options?: GetCachedScopedDashboardOptions) =>
    loadCachedScopedDashboard(scope, options)
)

export async function invalidateDashboardCache(_scope?: DashboardScope): Promise<void> {
  await invalidateKeysByPrefix("dashboard:")
}
