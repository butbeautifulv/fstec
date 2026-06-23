import "server-only"

import {
  mergeDashboardScope,
  parsePeriodFromSearchParams,
  type PeriodBounds,
  type PeriodRange,
} from "@/lib/dashboard/period-range"
import type { DashboardScope } from "@/lib/dashboard/stats"

export type DashboardUrlSearchParams = {
  overdue?: string
  from?: string
  to?: string
  period?: string
}

export function resolveDashboardSearch(
  baseScope: DashboardScope,
  searchParams: DashboardUrlSearchParams,
  bounds?: PeriodBounds
): {
  overdueOnly: boolean
  scope: DashboardScope
  period: PeriodRange
} {
  const overdueOnly = searchParams.overdue === "1"
  const period = parsePeriodFromSearchParams(searchParams, bounds)
  const scope = mergeDashboardScope(baseScope, period)
  return { overdueOnly, scope, period }
}
