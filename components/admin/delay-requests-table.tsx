"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { DataTable, DataTableColumnHeader, DataTableRowLink } from "@/components/data-table"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { DELAY_STATUS_LABELS } from "@/lib/delays"
import { labels } from "@/lib/ui/branding"
import { cn } from "@/lib/utils"
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
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

const STATUS_VARIANT: Record<
  DelayRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  APPROVED: "secondary",
  REJECTED: "outline",
}

function TruncatedCell({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("block min-w-0 truncate", className)} title={text}>
      {text}
    </span>
  )
}

export function DelayRequestsTable({
  initialRows,
}: {
  initialRows: DelayRequestTableRow[]
}) {
  const columns = useMemo<ColumnDef<DelayRequestTableRow>[]>(
    () => [
      {
        id: "organization",
        accessorFn: (row) => row.orderItem.order.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => {
          const org = row.original.orderItem.order.organization
          return (
            <Link
              href={`/admin/organizations/${org.id}`}
              className="block min-w-0 font-medium hover:underline"
            >
              <TruncatedCell text={org.name} />
            </Link>
          )
        },
        meta: colMeta(labels.org, { cellClassName: "max-w-0 w-[12%]" }),
      },
      {
        id: "order",
        accessorFn: (row) => row.orderItem.order.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => {
          const title = row.original.orderItem.order.title
          return (
            <Link
              href={`/admin/orders/${row.original.orderItem.order.id}`}
              className="block min-w-0 font-medium hover:underline"
            >
              <TruncatedCell text={title} />
            </Link>
          )
        },
        meta: colMeta("Поручение", { cellClassName: "max-w-0 w-[16%]" }),
      },
      {
        id: "measure",
        accessorFn: (row) => row.orderItem.measure.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мера" />
        ),
        cell: ({ row }) => {
          const name = row.original.orderItem.measure.name
          return (
            <Link
              href={`/admin/measures/${row.original.orderItem.measure.id}/edit`}
              className="block min-w-0 hover:underline"
            >
              <TruncatedCell text={name} />
            </Link>
          )
        },
        meta: colMeta("Мера", { cellClassName: "max-w-0 min-w-[10rem] w-[32%]" }),
      },
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
          <Badge variant={STATUS_VARIANT[row.original.status]}>
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
          <DataTableRowLink href={`/admin/delay-requests/${row.original.id}`} />
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
        return [
          row.orderItem.order.organization.name,
          row.orderItem.order.title,
          row.orderItem.measure.name,
          row.justification ?? "",
        ]
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
