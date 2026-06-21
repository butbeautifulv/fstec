import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import type { DashboardScope } from "@/lib/dashboard/stats"

/** Chart/table filter scope mirrors data scope type. */
export function chartScopeFromDashboardScope(scope: DashboardScope): ChartFilterScope {
  return scope.type
}

export function publicShowsSubdivisionColumn(scope: DashboardScope): boolean {
  return scope.type === "organization"
}
