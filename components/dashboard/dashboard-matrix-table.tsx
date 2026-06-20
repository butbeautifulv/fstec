"use client"

import { useMemo } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { Badge } from "@/components/ui/badge"
import { colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TextCell } from "@/lib/data-table/text-cell"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import { labels } from "@/lib/ui/branding"
import { getDisplayStatusName } from "@/lib/statuses/workflow"
import { format } from "date-fns"

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
      {
        id: "organization",
        accessorFn: (row) => row.order.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.order.organization.name}
            href={linkTargets.organization(row.original.order.organization.id)}
            linkClassName="font-normal"
          />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: textColumnMeta(labels.org, "w-[16%]"),
      },
      {
        id: "order",
        accessorFn: (row) => row.order.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.order.title}
            href={linkTargets.order(row.original.orderId)}
          />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: textColumnMeta("Поручение", "w-[20%]"),
      },
      {
        id: "measure",
        accessorFn: (row) => row.measure.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мера" />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.measure.name}
            href={linkTargets.measure(row.original)}
          />
        ),
        meta: textColumnMeta("Мера", "min-w-[10rem] w-[28%]"),
      },
      {
        id: "status",
        accessorFn: (row) => getDisplayStatusName(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isOverdue ? "destructive" : "secondary"}>
            {getDisplayStatusName(row.original)}
          </Badge>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Статус", { cellClassName: "w-32" }),
      },
      {
        accessorKey: "dueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.dueAt), "dd.MM.yyyy"),
        meta: colMeta("Срок", { valueType: "date", cellClassName: "w-28" }),
      },
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
