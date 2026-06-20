"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { Badge } from "@/components/ui/badge"
import { colMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { labels } from "@/lib/ui/branding"
import { getDisplayStatusName } from "@/lib/statuses/workflow"
import { format } from "date-fns"

type MatrixItem = {
  id: number
  orderId: number
  dueAt: string
  isOverdue: boolean
  measure: { id: number; name: string }
  order: { title: string; organization: { id: number; name: string } }
  status: { name: string; isTerminal: boolean }
}

export function AdminDashboardMatrix({
  items,
  columnFilters,
  onColumnFiltersChange,
}: {
  items: MatrixItem[]
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  const columns = useMemo<ColumnDef<MatrixItem>[]>(
    () => [
      {
        id: "organization",
        accessorFn: (row) => row.order.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/organizations/${row.original.order.organization.id}`}
            className="hover:underline"
          >
            {row.original.order.organization.name}
          </Link>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta(labels.org),
      },
      {
        id: "order",
        accessorFn: (row) => row.order.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/orders/${row.original.orderId}`}
            className="underline-offset-4 hover:underline"
          >
            {row.original.order.title}
          </Link>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Поручение"),
      },
      {
        id: "measure",
        accessorFn: (row) => row.measure.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мера" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/measures/${row.original.measure.id}/edit`}
            className="font-medium hover:underline"
          >
            {row.original.measure.name}
          </Link>
        ),
        meta: colMeta("Мера"),
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
        meta: colMeta("Статус"),
      },
      {
        accessorKey: "dueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.dueAt), "dd.MM.yyyy"),
        meta: colMeta("Срок", { valueType: "date" }),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={items}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
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
