import { cache } from "react"
import { buildMatrixFromItems } from "@/lib/dashboard/build-matrix"
import { fetchScopedItems } from "@/lib/dashboard/fetch-scoped-items"
import { deserializeDashboardScope, serializeDashboardScope } from "@/lib/dashboard/scope-key"
import {
  buildScopedStatsFromItems,
  type DashboardScope,
  type ScopedDashboardStats,
} from "@/lib/dashboard/stats"
import type { DashboardMatrixItem } from "@/lib/dashboard/build-matrix"

export type ScopedDashboardData = {
  stats: ScopedDashboardStats
  items: DashboardMatrixItem[]
}

const loadScopedDashboard = cache(async (scopeKey: string): Promise<ScopedDashboardData> => {
  const scope = deserializeDashboardScope(scopeKey)
  const items = await fetchScopedItems(scope)
  const now = new Date()
  return {
    stats: buildScopedStatsFromItems(scope, items, now),
    items: buildMatrixFromItems(items, now),
  }
})

export function getScopedDashboard(scope: DashboardScope): Promise<ScopedDashboardData> {
  return loadScopedDashboard(serializeDashboardScope(scope))
}
