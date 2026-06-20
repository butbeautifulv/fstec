"use client"

import { useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import type { PublicItem, PublicStatus } from "@/components/public/public-measures-table"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
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

export function PublicDashboardInteractive({
  scope,
  stats,
  token,
  items,
  statuses,
  showSubdivisionColumn,
  overdueOnly,
}: {
  scope: "organization" | "subdivision"
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
  overdueOnly: boolean
}) {
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

      <ScopedDashboardView
        key={overdueOnly ? "overdue" : "all"}
        variant="public"
        scope={scope}
        stats={stats}
        token={token}
        items={items}
        statuses={statuses}
        showSubdivisionColumn={showSubdivisionColumn}
        overdueOnly={overdueOnly}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
    </>
  )
}
