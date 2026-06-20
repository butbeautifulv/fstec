"use client"

import { useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import {
  overdueInitialFilters,
  toggleStatusFilter,
} from "@/lib/dashboard/chart-filters"
import type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"

export type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
export type { DashboardVariant } from "@/lib/dashboard/variant-config"

function activeStatusFromFilters(filters: ColumnFiltersState): string | undefined {
  const statusFilter = filters.find((f) => f.id === "status")
  const values = statusFilter?.value
  if (!Array.isArray(values) || values.length !== 1) return undefined
  return values[0]
}

export function DashboardInteractive({
  showStatCards = true,
  ...props
}: DashboardInteractiveProps & { showStatCards?: boolean }) {
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
      {showStatCards ? (
        <DashboardStatCards
          stats={stats}
          activeStatus={activeStatus}
          onStatusClick={(status) =>
            setColumnFilters((prev) => toggleStatusFilter(prev, status))
          }
        />
      ) : null}
      <ScopedDashboardView
        {...props}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
    </>
  )
}
