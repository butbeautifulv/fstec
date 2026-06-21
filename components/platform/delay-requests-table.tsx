"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { DataTable, DataTableColumnHeader, DataTableRowLink } from "@/components/data-table"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import {
  createOrderItemContextColumns,
  orderItemContextSearchFields,
} from "@/lib/data-table/columns"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { DELAY_STATUS_LABELS, DELAY_STATUS_VARIANT } from "@/lib/ui/delay-status"
import { format } from "date-fns"
import { DelayRequestStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

export type DelayRequestTableRow = {
  id: number
  status: DelayRequestStatus
  requestedDueAt: string
  justification: string | null
  createdAt: string
  orderItem: {
    id: number
    dueAt: string
    measure: { id: number; name: string }
    subdivision: { id: number; name: string } | null
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export function DelayRequestsTable({
  initialRows,
}: {
  initialRows: DelayRequestTableRow[]
}) {
  const columns = useMemo<ColumnDef<DelayRequestTableRow>[]>(
    () => [
      ...createOrderItemContextColumns<DelayRequestTableRow>(
        (row) => ({
          organization: row.orderItem.order.organization,
          order: row.orderItem.order,
          measure: row.orderItem.measure,
          subdivision: row.orderItem.subdivision,
        })
      ),
      {
        id: "currentDue",
        accessorFn: (row) => row.orderItem.dueAt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Текущий срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.orderItem.dueAt), "dd.MM.yyyy"),
        meta: colMeta("Текущий срок", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        accessorKey: "requestedDueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Новый срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.requestedDueAt), "dd.MM.yyyy"),
        meta: colMeta("Новый срок", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => (
          <Badge variant={DELAY_STATUS_VARIANT[row.original.status]}>
            {DELAY_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
        meta: colMeta("Статус", {
          valueLabels: DELAY_STATUS_LABELS,
          cellClassName: "w-32",
        }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <DataTableRowLink href={`/panel/delay-requests/${row.original.id}`} />
        ),
        meta: actionsColumnMeta(),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={initialRows}
      searchPlaceholder="Поиск по организации, поручению, мере…"
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return orderItemContextSearchFields(
          {
            organization: row.orderItem.order.organization,
            order: row.orderItem.order,
            measure: row.orderItem.measure,
          },
          [row.justification ?? ""]
        )
          .join(" ")
          .toLowerCase()
          .includes(q)
      }}
      empty={
        <EmptyTableState
          title="Нет заявок на перенос"
          description="Запросы от исполнителей появятся здесь"
        />
      }
    />
  )
}
