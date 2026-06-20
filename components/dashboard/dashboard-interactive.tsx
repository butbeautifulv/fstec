"use client"

import { useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import type { PublicItem, PublicStatus } from "@/components/public/public-measures-table"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import {
  overdueInitialFilters,
  toggleStatusFilter,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"

function activeStatusFromFilters(filters: ColumnFiltersState): string | undefined {
  const statusFilter = filters.find((f) => f.id === "status")
  const values = statusFilter?.value
  if (!Array.isArray(values) || values.length !== 1) return undefined
  return values[0]
}

type AdminDashboardInteractiveProps = {
  variant: "admin"
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

export function DashboardInteractive(
  props: AdminDashboardInteractiveProps | PublicDashboardInteractiveProps | ReportDashboardInteractiveProps
) {
  const { stats, overdueOnly } = props
  const initialFilters = useMemo(
    () => (overdueOnly ? overdueInitialFilters() : []),
    [overdueOnly]
  )
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters)

  const activeStatus = activeStatusFromFilters(columnFilters)

  return (
    <>
      <DashboardStatCards
        stats={stats}
        activeStatus={activeStatus}
        onStatusClick={(status) =>
          setColumnFilters((prev) => toggleStatusFilter(prev, status))
        }
      />

      {props.variant === "admin" ? (
        <ScopedDashboardView
          key={overdueOnly ? "overdue" : "all"}
          variant="admin"
          scope={props.scope}
          stats={stats}
          items={props.items}
          overdueOnly={overdueOnly}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      ) : props.variant === "report" ? (
        <ScopedDashboardView
          key={overdueOnly ? "overdue" : "all"}
          variant="report"
          scope={props.scope}
          stats={stats}
          token={props.token}
          items={props.items}
          overdueOnly={overdueOnly}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      ) : (
        <ScopedDashboardView
          key={overdueOnly ? "overdue" : "all"}
          variant="public"
          scope={props.scope}
          stats={stats}
          token={props.token}
          items={props.items}
          statuses={props.statuses}
          showSubdivisionColumn={props.showSubdivisionColumn}
          overdueOnly={overdueOnly}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      )}
    </>
  )
}
