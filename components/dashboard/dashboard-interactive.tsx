"use client"

import { useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import type { DashboardVariant } from "@/lib/dashboard/variant-config"
import {
  overdueInitialFilters,
  toggleStatusFilter,
} from "@/lib/dashboard/chart-filters"

function activeStatusFromFilters(filters: ColumnFiltersState): string | undefined {
  const statusFilter = filters.find((f) => f.id === "status")
  const values = statusFilter?.value
  if (!Array.isArray(values) || values.length !== 1) return undefined
  return values[0]
}

type PlatformDashboardInteractiveProps = {
  variant: "platform"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
  overdueOnly: boolean
}

type PublicDashboardInteractiveProps = {
  variant: "public"
  scope: "organization" | "subdivision"
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
  overdueOnly: boolean
}

type ReportDashboardInteractiveProps = {
  variant: "report"
  scope: "global"
  stats: ScopedDashboardStats
  token: string
  items: DashboardMatrixRow[]
  overdueOnly: boolean
}

export type DashboardInteractiveProps =
  | PlatformDashboardInteractiveProps
  | PublicDashboardInteractiveProps
  | ReportDashboardInteractiveProps

export function DashboardInteractive(props: DashboardInteractiveProps) {
  const { stats, overdueOnly } = props
  const initialFilters = useMemo(
    () => (overdueOnly ? overdueInitialFilters() : []),
    [overdueOnly]
  )
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters)

  const activeStatus = activeStatusFromFilters(columnFilters)

  const viewProps = {
    stats,
    overdueOnly,
    columnFilters,
    onColumnFiltersChange: setColumnFilters,
  } as const

  const view =
    props.variant === "platform" ? (
      <ScopedDashboardView
        {...viewProps}
        variant="platform"
        scope={props.scope}
        items={props.items}
      />
    ) : props.variant === "report" ? (
      <ScopedDashboardView
        {...viewProps}
        variant="report"
        scope={props.scope}
        token={props.token}
        items={props.items}
      />
    ) : (
      <ScopedDashboardView
        {...viewProps}
        variant="public"
        scope={props.scope}
        token={props.token}
        items={props.items}
        statuses={props.statuses}
        showSubdivisionColumn={props.showSubdivisionColumn}
      />
    )

  return (
    <>
      <DashboardStatCards
        stats={stats}
        activeStatus={activeStatus}
        onStatusClick={(status) =>
          setColumnFilters((prev) => toggleStatusFilter(prev, status))
        }
      />
      {view}
    </>
  )
}

export type { DashboardVariant }
