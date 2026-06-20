"use client"

import { useMemo } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import {
  createDueAtColumn,
  createMatrixWorkflowStatusColumn,
  createMeasureColumn,
  createOrderColumn,
  createOrganizationColumn,
} from "@/lib/data-table/columns"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import { labels } from "@/lib/ui/branding"
import { getDisplayStatusName } from "@/lib/statuses/workflow"

export type DashboardMatrixLinkTargets = {
  organization: (orgId: number) => string
  order: (orderId: number) => string
  measure: (row: DashboardMatrixRow) => string
}

export function DashboardMatrixTable({
  items,
  linkTargets,
  columnFilters,
  onColumnFiltersChange,
}: {
  items: DashboardMatrixRow[]
  linkTargets: DashboardMatrixLinkTargets
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  const columns = useMemo<ColumnDef<DashboardMatrixRow>[]>(
    () => [
      createOrganizationColumn(
        (row) => row.order.organization,
        (org) => linkTargets.organization(org.id),
        "w-[16%]"
      ),
      createOrderColumn(
        (row) => ({ id: row.orderId, title: row.order.title }),
        (order) => linkTargets.order(order.id),
        "w-[20%]"
      ),
      createMeasureColumn(
        (row) => row.measure,
        () => "#",
        {
          width: "min-w-[10rem] w-[28%]",
          linkClassName: undefined,
          hrefFromRow: (row) => linkTargets.measure(row),
        }
      ),
      createMatrixWorkflowStatusColumn(
        (row) => getDisplayStatusName(row),
        (row) => row.isOverdue
      ),
      createDueAtColumn<DashboardMatrixRow>("dueAt"),
    ],
    [linkTargets]
  )

  return (
    <DataTable
      columns={columns}
      data={items}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      hideOnMobileColumnIds={["organization", "order"]}
      searchPlaceholder={`Поиск по ${labels.org.toLowerCase()}, поручению, мере…`}
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        const haystack = [
          row.order.organization.name,
          row.order.title,
          row.measure.name,
          getDisplayStatusName(row),
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      }}
      empty={
        <EmptyTableState title="Нет данных" description="Нет мер для отображения" />
      }
    />
  )
}
