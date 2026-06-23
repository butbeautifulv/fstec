"use client"

import { useCallback, useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardFiltersBar } from "@/components/dashboard/dashboard-filters-bar"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import {
  overdueInitialFilters,
  toggleDashboardStatusFilter,
  isDashboardStatusFilterActive,
} from "@/lib/dashboard/chart-filters"
import {
  defaultVisibleChartStatuses,
  setVisibleChartStatuses as applyVisibleChartStatuses,
} from "@/lib/dashboard/chart-visibility"
import { DASHBOARD_STATUS_ORDER } from "@/lib/statuses/workflow"
import type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
import type { PeriodBounds } from "@/lib/dashboard/period-range"

export type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
export type { DashboardVariant } from "@/lib/dashboard/variant-config"

function activeDashboardStatusFromFilters(
  filters: ColumnFiltersState
): string | undefined {
  for (const status of DASHBOARD_STATUS_ORDER) {
    if (isDashboardStatusFilterActive(filters, status)) return status
  }
  return undefined
}

export function DashboardInteractive({
  showStatCards = true,
  showCharts = true,
  showMatrix = true,
  periodBounds,
  ...props
}: DashboardInteractiveProps & {
  showStatCards?: boolean
  showCharts?: boolean
  showMatrix?: boolean
  periodBounds?: PeriodBounds
}) {
  const { stats, overdueOnly } = props
  const initialFilters = useMemo(
    () => (overdueOnly ? overdueInitialFilters() : []),
    [overdueOnly]
  )
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters)
  const [visibleChartStatuses, setVisibleChartStatuses] = useState(() =>
    defaultVisibleChartStatuses(DASHBOARD_STATUS_ORDER)
  )

  const handleVisibleChartStatusesChange = useCallback((next: Set<string>) => {
    setVisibleChartStatuses(
      applyVisibleChartStatuses(next, DASHBOARD_STATUS_ORDER)
    )
  }, [])

  const activeStatus = activeDashboardStatusFromFilters(columnFilters)

  return (
    <>
      {showStatCards ? (
        <DashboardStatCards
          stats={stats}
          activeStatus={activeStatus}
          onStatusClick={(status) =>
            setColumnFilters((prev) => toggleDashboardStatusFilter(prev, status))
          }
        />
      ) : null}

      {periodBounds ? (
        <DashboardFiltersBar
          periodBounds={periodBounds}
          statusDistribution={stats.statusDistribution}
          visibleChartStatuses={visibleChartStatuses}
          onVisibleChartStatusesChange={handleVisibleChartStatusesChange}
        />
      ) : null}

      {showCharts || showMatrix ? (
        <ScopedDashboardView
          {...props}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          visibleChartStatuses={visibleChartStatuses}
          showCharts={showCharts}
          showMatrix={showMatrix}
        />
      ) : null}
    </>
  )
}
