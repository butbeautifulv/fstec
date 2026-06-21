"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardMatrixTable } from "@/components/dashboard/dashboard-matrix-table"
import type { DashboardMatrixLinkTargets } from "@/components/dashboard/dashboard-matrix-table"
import { MeasuresDataTable } from "@/components/shared/measures-data-table"
import {
  dashboardLinkTargets,
  type PublicDashboardLinkTargets,
} from "@/lib/dashboard/link-targets"
import { publicShowsSubdivisionColumn } from "@/lib/dashboard/chart-scope"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { DashboardVariant } from "@/lib/dashboard/variant-config"
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import { getDashboardVariantConfig } from "@/lib/dashboard/variant-config"

export function DashboardScopedTable({
  variant,
  chartScope,
  dashboardScope,
  linkScope,
  token,
  items,
  statuses,
  columnFilters,
  onColumnFiltersChange,
  pageSize = 50,
}: {
  variant: DashboardVariant
  chartScope: ChartFilterScope
  dashboardScope: DashboardScope
  linkScope?: DashboardScope
  token?: string
  items: DashboardMatrixRow[] | PublicItem[]
  statuses?: PublicStatus[]
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: Dispatch<SetStateAction<ColumnFiltersState>>
  pageSize?: number
}) {
  const variantConfig = getDashboardVariantConfig(variant)

  if (variantConfig.tableKind === "measures" && variant === "public") {
    const publicItems = items as PublicItem[]
    const linkTargets = dashboardLinkTargets("public", {
      token,
      scope: dashboardScope,
    }) as PublicDashboardLinkTargets

    return (
      <MeasuresDataTable
        basePath={linkTargets.basePath}
        items={publicItems}
        statuses={statuses ?? []}
        showSubdivisionColumn={publicShowsSubdivisionColumn(dashboardScope)}
        subdivisionHref={linkTargets.subdivisionHref}
        actionLabel="Заполнить"
        columnFilters={columnFilters}
        onColumnFiltersChange={onColumnFiltersChange}
        pageSize={pageSize}
      />
    )
  }

  const matrixLinkTargets = dashboardLinkTargets(
    variant === "report" ? "report" : "platform",
    variant === "report"
      ? { token, linkScope: linkScope ?? dashboardScope }
      : { scope: dashboardScope }
  ) as DashboardMatrixLinkTargets

  return (
    <DashboardMatrixTable
      items={items as DashboardMatrixRow[]}
      linkTargets={matrixLinkTargets}
      chartScope={chartScope}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      pageSize={pageSize}
    />
  )
}
