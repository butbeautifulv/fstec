"use client"

import {
  DashboardInteractive as GuiDashboardInteractive,
} from "@cxado/gui/dashboard/dashboard-interactive"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import { DashboardScopedTable } from "@/components/dashboard/dashboard-scoped-table"
import type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
import type { ScopedTableRenderProps } from "@cxado/gui/lib/dashboard/interactive-props"
import type { PeriodBounds } from "@/lib/dashboard/period-range"

export type { DashboardInteractiveProps, DashboardVariant } from "@/lib/dashboard/interactive-props"

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

export function DashboardInteractive(
  props: DashboardInteractiveProps & {
    showStatCards?: boolean
    showCharts?: boolean
    showMatrix?: boolean
    periodBounds?: PeriodBounds
  }
) {
  return (
    <GuiDashboardInteractive
      {...(props as unknown as Parameters<typeof GuiDashboardInteractive>[0])}
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      renderScopedTable={renderScopedTable}
    />
  )
}
