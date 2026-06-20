"use client"

import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardMatrixTable } from "@/components/dashboard/dashboard-matrix-table"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"

export function ReportDashboardMatrix({
  token,
  items,
  columnFilters,
  onColumnFiltersChange,
}: {
  token: string
  items: DashboardMatrixRow[]
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  return (
    <DashboardMatrixTable
      items={items}
      linkTargets={{
        organization: (orgId) => `/report/${token}/organizations/${orgId}`,
        order: (orderId) => `/report/${token}/orders/${orderId}`,
        measure: (row) => `/report/${token}/items/${row.id}`,
      }}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    />
  )
}
