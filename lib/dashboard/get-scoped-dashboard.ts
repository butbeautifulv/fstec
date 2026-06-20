import { cache } from "react"
import { buildMatrixFromItems } from "@/lib/dashboard/build-matrix"
import { fetchScopedItems } from "@/lib/dashboard/fetch-scoped-items"
import { serializeDashboardScope } from "@/lib/dashboard/scope-key"
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

function deserializeDashboardScope(scopeKey: string): DashboardScope {
  if (scopeKey === "global") return { type: "global" }
  if (scopeKey.startsWith("organization:")) {
    return {
      type: "organization",
      organizationId: Number(scopeKey.slice("organization:".length)),
    }
  }
  if (scopeKey.startsWith("subdivision:")) {
    const [, organizationId, subdivisionId] = scopeKey.split(":")
    return {
      type: "subdivision",
      organizationId: Number(organizationId),
      subdivisionId: Number(subdivisionId),
    }
  }
  return { type: "global" }
}
