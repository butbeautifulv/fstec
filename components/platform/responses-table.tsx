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
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"
import { format } from "date-fns"
import { ResponseReviewStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

export type ResponseTableRow = {
  id: number
  reviewStatus: ResponseReviewStatus
  result: string
  submittedByLabel: string | null
  submittedAt: string
  orderItem: {
    id: number
    measure: { id: number; name: string }
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export function ResponsesTable({
  initialRows,
}: {
  initialRows: ResponseTableRow[]
}) {
  const columns = useMemo<ColumnDef<ResponseTableRow>[]>(
    () => [
      ...createOrderItemContextColumns<ResponseTableRow>(
        (row) => ({
          organization: row.orderItem.order.organization,
          order: row.orderItem.order,
          measure: row.orderItem.measure,
        })
      ),
      {
        accessorKey: "submittedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Дата отправки" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.submittedAt), "dd.MM.yyyy HH:mm"),
        meta: colMeta("Дата отправки", { valueType: "date", cellClassName: "w-36" }),
      },
      {
        accessorKey: "reviewStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => (
          <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[row.original.reviewStatus]}>
            {RESPONSE_REVIEW_STATUS_LABELS[row.original.reviewStatus]}
          </Badge>
        ),
        meta: colMeta("Статус", {
          valueLabels: RESPONSE_REVIEW_STATUS_LABELS,
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
          <DataTableRowLink href={`/panel/responses/${row.original.id}`} />
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
          [row.submittedByLabel ?? "", row.result]
        )
          .join(" ")
          .toLowerCase()
          .includes(q)
      }}
      empty={
        <EmptyTableState
          title="Нет отчётов"
          description="Отчёты исполнителей появятся здесь"
        />
      }
    />
  )
}
