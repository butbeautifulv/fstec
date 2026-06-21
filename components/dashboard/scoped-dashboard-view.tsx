"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { ScopedDashboardCharts } from "@/components/dashboard/scoped-dashboard-charts"
import { DashboardScopedTable } from "@/components/dashboard/dashboard-scoped-table"
import type { ScopedDashboardStats, DashboardScope } from "@/lib/dashboard/stats"
import {
  toggleBreakdownFilter,
  toggleOverdueLegendFilter,
  toggleOverdueSegmentFilter,
  toggleStatusBreakdownFilter,
  toggleStatusFilter,
  toggleStatusFilterPreserveBreakdown,
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
}: ScopedDashboardViewProps) {
  return (
    <>
      <ScopedDashboardCharts
        scope={scope}
        statusDistribution={stats.statusDistribution}
        overdueBreakdown={stats.overdueBreakdown}
        statusBreakdown={stats.statusBreakdown}
        overdueTitle={stats.chartLabels.overdueTitle}
        completionTitle={stats.chartLabels.completionTitle}
        columnFilters={columnFilters}
        onStatusClick={(status) =>
          onColumnFiltersChange((prev) => toggleStatusFilter(prev, status))
        }
        onOverdueBarClick={(label) =>
          onColumnFiltersChange((prev) => toggleBreakdownFilter(prev, scope, label))
        }
        onOverdueSegmentClick={(label, segment) =>
          onColumnFiltersChange((prev) =>
            toggleOverdueSegmentFilter(prev, scope, label, segment)
          )
        }
        onOverdueLegendClick={(segment) =>
          onColumnFiltersChange((prev) => toggleOverdueLegendFilter(prev, segment))
        }
        onStatusBreakdownClick={(label, status) =>
          onColumnFiltersChange((prev) =>
            toggleStatusBreakdownFilter(prev, scope, label, status)
          )
        }
        onCompletionLegendClick={(status) =>
          onColumnFiltersChange((prev) =>
            toggleStatusFilterPreserveBreakdown(prev, status)
          )
        }
      />

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
    </>
  )
}
