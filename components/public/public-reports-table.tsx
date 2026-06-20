"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { DataTable, DataTableColumnHeader, DataTableRowLink } from "@/components/data-table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { actionsColumnMeta, colMeta } from "@/lib/data-table/column-meta"
import { createMeasureColumn, createOrderColumn } from "@/lib/data-table/columns"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TruncatedCell } from "@/lib/data-table/text-cell"
import type { PublicReportRow } from "@/lib/public/reports"
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"
import { format } from "date-fns"

export function PublicReportsTable({
  token,
  rows,
}: {
  token: string
  rows: PublicReportRow[]
}) {
  const basePath = `/p/${token}`

  const columns = useMemo<ColumnDef<PublicReportRow>[]>(
    () => [
      createOrderColumn(
        (row) => row.order,
        (order) => `${basePath}/orders/${order.id}`,
        "w-[18%]"
      ),
      createMeasureColumn(
        (row) => ({ id: row.orderItemId, name: row.measure.name }),
        () => "#",
        {
          width: "min-w-[10rem] w-[24%]",
          hrefFromRow: (row) => `${basePath}/items/${row.orderItemId}`,
        }
      ),
      {
        accessorKey: "submittedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Дата отправки" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) =>
          row.original.submittedAt
            ? format(new Date(row.original.submittedAt), "dd.MM.yyyy HH:mm")
            : "—",
        meta: colMeta("Дата отправки", { valueType: "date", cellClassName: "w-36" }),
      },
      {
        accessorKey: "reviewStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => {
          const status = row.original.reviewStatus
          if (!status) return "—"
          return (
            <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[status]}>
              {RESPONSE_REVIEW_STATUS_LABELS[status]}
            </Badge>
          )
        },
        meta: colMeta("Статус", {
          valueLabels: RESPONSE_REVIEW_STATUS_LABELS,
          cellClassName: "w-32",
        }),
      },
      {
        id: "reviewNote",
        accessorFn: (row) => row.reviewNote ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Замечания" />
        ),
        cell: ({ row }) => {
          const note = row.original.reviewNote
          if (!note || !row.original.needsRevision) {
            return <span className="text-muted-foreground">—</span>
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 cursor-default">
                  <TruncatedCell text={note} />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-sm whitespace-pre-wrap text-left"
              >
                {note}
              </TooltipContent>
            </Tooltip>
          )
        },
        meta: colMeta("Замечания", { cellClassName: "min-w-[8rem] w-[28%]" }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <DataTableRowLink
            href={`${basePath}/items/${row.original.orderItemId}`}
            label={row.original.needsRevision ? "Исправить" : "Открыть"}
          />
        ),
        meta: actionsColumnMeta(),
      },
    ],
    [basePath]
  )

  return (
    <TooltipProvider>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Поиск по поручению, мере, замечаниям…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          const item = row
          return [
            item.order.title,
            item.measure.name,
            item.measure.code ?? "",
            item.reviewNote ?? "",
            item.reviewStatus ? RESPONSE_REVIEW_STATUS_LABELS[item.reviewStatus] : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        getRowClassName={(row) =>
          row.needsRevision ? "bg-destructive/5 hover:bg-destructive/10" : undefined
        }
        empty={
          <EmptyTableState
            title="Нет отчётов"
            description="Отправленные отчёты по мерам появятся здесь"
          />
        }
      />
    </TooltipProvider>
  )
}
