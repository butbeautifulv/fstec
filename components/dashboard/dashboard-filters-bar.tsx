"use client"

import { DashboardChartStatusFacetedFilter } from "@/components/dashboard/dashboard-chart-status-faceted-filter"
import {
  DashboardPeriodSection,
  DASHBOARD_PERIOD_LABELS,
} from "@/components/dashboard/dashboard-period-section"
import type { StatusDistribution } from "@/lib/dashboard/stats"
import type { PeriodBounds } from "@/lib/dashboard/period-range"

export function DashboardFiltersBar({
  periodBounds,
  statusDistribution,
  visibleChartStatuses,
  onVisibleChartStatusesChange,
}: {
  periodBounds: PeriodBounds
  statusDistribution: StatusDistribution[]
  visibleChartStatuses: ReadonlySet<string>
  onVisibleChartStatusesChange: (next: Set<string>) => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPeriodSection
          bounds={periodBounds}
          embedded
          label={DASHBOARD_PERIOD_LABELS.orders}
        />
        <div className="flex shrink-0 items-center lg:pt-1">
          <DashboardChartStatusFacetedFilter
            statusDistribution={statusDistribution}
            visibleChartStatuses={visibleChartStatuses}
            onVisibleChartStatusesChange={onVisibleChartStatusesChange}
          />
        </div>
      </div>
    </div>
  )
}
