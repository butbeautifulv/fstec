import { cache } from "react"
import { buildMatrixFromItems } from "@/lib/dashboard/build-matrix"
import type { DashboardMatrixQuery } from "@/lib/dashboard/dashboard-query"
import { fetchScopedItems } from "@/lib/dashboard/fetch-scoped-items"
import { fetchScopedStats } from "@/lib/dashboard/fetch-scoped-stats"
import { serializeDashboardScope } from "@/lib/dashboard/scope-key"
import {
  serializeMatrixItems,
  type SerializedMatrixItem,
} from "@/lib/dashboard/serialize-dashboard"
import type { DashboardScope, ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixItem } from "@/lib/dashboard/build-matrix"

export type ScopedDashboardData = {
  stats: ScopedDashboardStats
  items: DashboardMatrixItem[]
}

const loadScopedDashboardStats = cache(
  async (scopeKey: string): Promise<ScopedDashboardStats> => {
    const scope = deserializeDashboardScope(scopeKey)
    return fetchScopedStats(scope)
  }
)

export function getScopedDashboardStats(scope: DashboardScope): Promise<ScopedDashboardStats> {
  return loadScopedDashboardStats(serializeDashboardScope(scope))
}

export async function getScopedDashboardItems(
  scope: DashboardScope,
  query: DashboardMatrixQuery
): Promise<DashboardMatrixItem[]> {
  const now = new Date()
  const rows = await fetchScopedItems(scope, query, now)
  return buildMatrixFromItems(rows, now)
}

export async function getScopedDashboardItemsSerialized(
  scope: DashboardScope,
  query: DashboardMatrixQuery
): Promise<SerializedMatrixItem[]> {
  const items = await getScopedDashboardItems(scope, query)
  return serializeMatrixItems(items)
}

/** @deprecated Use getScopedDashboardStats + getScopedDashboardItems */
export async function getScopedDashboard(scope: DashboardScope): Promise<ScopedDashboardData> {
  const query: DashboardMatrixQuery = { overdueOnly: false }
  const [stats, items] = await Promise.all([
    getScopedDashboardStats(scope),
    getScopedDashboardItems(scope, query),
  ])
  return { stats, items }
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
