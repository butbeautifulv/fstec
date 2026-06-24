"use client"

import {
  ScopedDashboardView as GuiScopedDashboardView,
} from "@cxado/gui/dashboard/scoped-dashboard-view"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import { DashboardScopedTable } from "@/components/dashboard/dashboard-scoped-table"
import type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
import type { ScopedTableRenderProps } from "@cxado/gui/lib/dashboard/interactive-props"
import type { ColumnFiltersState } from "@tanstack/react-table"
import type { Dispatch, SetStateAction } from "react"

type ScopedDashboardViewProps = DashboardInteractiveProps & {
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: Dispatch<SetStateAction<ColumnFiltersState>>
  visibleChartStatuses: ReadonlySet<string>
  showCharts?: boolean
  showMatrix?: boolean
}

function renderScopedTable(ctx: ScopedTableRenderProps) {
  return (
    <DashboardScopedTable
      variant={ctx.variant}
      chartScope={ctx.scope}
      dashboardScope={ctx.dashboardScope}
      linkScope={"linkScope" in ctx ? ctx.linkScope : undefined}
      token={"token" in ctx ? ctx.token : undefined}
      items={ctx.items}
      statuses={"statuses" in ctx ? ctx.statuses : undefined}
      columnFilters={ctx.columnFilters}
      onColumnFiltersChange={ctx.onColumnFiltersChange}
    />
  )
}

export function ScopedDashboardView({
  columnFilters,
  onColumnFiltersChange,
  visibleChartStatuses,
  showCharts = true,
  showMatrix = true,
  ...props
}: ScopedDashboardViewProps) {
  const scopedTableCtx = {
    ...props,
    columnFilters,
    onColumnFiltersChange,
  } as unknown as ScopedTableRenderProps

  return (
    <GuiScopedDashboardView
      {...(props as unknown as Parameters<typeof GuiScopedDashboardView>[0])}
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      visibleChartStatuses={visibleChartStatuses}
      showCharts={showCharts}
      showMatrix={showMatrix}
      scopedTableCtx={scopedTableCtx}
      renderScopedTable={renderScopedTable}
    />
  )
}
