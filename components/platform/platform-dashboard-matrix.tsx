"use client"

import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardMatrixTable } from "@/components/dashboard/dashboard-matrix-table"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"

export function PlatformDashboardMatrix({
  items,
  columnFilters,
  onColumnFiltersChange,
}: {
  items: DashboardMatrixRow[]
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  return (
    <DashboardMatrixTable
      items={items}
      linkTargets={{
        organization: (orgId) => `/panel/organizations/${orgId}`,
        order: (orderId) => `/panel/orders/${orderId}`,
        measure: (row) => `/panel/measures/${row.measure.id}/edit`,
      }}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    />
  )
}
