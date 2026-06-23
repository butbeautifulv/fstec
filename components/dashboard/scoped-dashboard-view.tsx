"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { ScopedDashboardCharts } from "@/components/dashboard/scoped-dashboard-charts"
import { DashboardScopedTable } from "@/components/dashboard/dashboard-scoped-table"
import type { ScopedDashboardStats, DashboardScope } from "@/lib/dashboard/stats"
import {
  toggleBreakdownFilter,
  toggleStatusBreakdownFilter,
  toggleStatusFilter,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { DashboardVariant } from "@/lib/dashboard/variant-config"

type ScopedDashboardViewProps = {
  variant: DashboardVariant
  scope: ChartFilterScope
  dashboardScope: DashboardScope
  linkScope?: DashboardScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[] | PublicItem[]
  token?: string
  statuses?: PublicStatus[]
  showSubdivisionColumn?: boolean
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: Dispatch<SetStateAction<ColumnFiltersState>>
  visibleChartStatuses: ReadonlySet<string>
  showCharts?: boolean
  showMatrix?: boolean
}

export function ScopedDashboardView({
  variant,
  scope,
  dashboardScope,
  linkScope,
  stats,
  items,
  token,
  statuses,
  columnFilters,
  onColumnFiltersChange,
  visibleChartStatuses,
  showCharts = true,
  showMatrix = true,
}: ScopedDashboardViewProps) {
  return (
    <>
      {showCharts ? (
        <ScopedDashboardCharts
          scope={scope}
          statusDistribution={stats.statusDistribution}
          statusBreakdown={stats.statusBreakdown}
          overdueTitle={stats.chartLabels.overdueTitle}
          completionTitle={stats.chartLabels.completionTitle}
          columnFilters={columnFilters}
          visibleChartStatuses={visibleChartStatuses}
          onStatusClick={(status) =>
            onColumnFiltersChange((prev) => toggleStatusFilter(prev, status))
          }
          onOverdueBarClick={(label) =>
            onColumnFiltersChange((prev) => toggleBreakdownFilter(prev, scope, label))
          }
          onStatusBreakdownClick={(label, status) =>
            onColumnFiltersChange((prev) =>
              toggleStatusBreakdownFilter(prev, scope, label, status)
            )
          }
        />
      ) : null}

      {showMatrix ? (
        <DashboardScopedTable
          variant={variant}
          chartScope={scope}
          dashboardScope={dashboardScope}
          linkScope={linkScope}
          token={token}
          items={items}
          statuses={statuses}
          columnFilters={columnFilters}
          onColumnFiltersChange={onColumnFiltersChange}
          pageSize={50}
        />
      ) : null}
    </>
  )
}
