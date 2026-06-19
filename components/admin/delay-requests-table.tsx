"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { DELAY_STATUS_LABELS } from "@/lib/delays"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { DelayRequestStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

export function DelayRequestsTable({
  initialRows,
}: {
  initialRows: DelayRequestTableRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const reviewDelay = useCallback(
    async (id: number, action: "approve" | "reject") => {
      setProcessingId(id)
      const res = await fetch("/api/delay-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      setProcessingId(null)
      if (res.ok) {
        notify.success(action === "approve" ? "Перенос одобрен" : "Перенос отклонён")
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  status:
                    action === "approve"
                      ? DelayRequestStatus.APPROVED
                      : DelayRequestStatus.REJECTED,
                }
              : row
          )
        )
        router.refresh()
      } else {
        notify.error("Не удалось обработать запрос")
      }
    },
    [router]
  )

  const columns = useMemo<ColumnDef<DelayRequestTableRow>[]>(
    () => [
      {
        id: "organization",
        accessorFn: (row) => row.orderItem.order.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => row.original.orderItem.order.organization.name,
      },
      {
        id: "order",
        accessorFn: (row) => row.orderItem.order.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/orders/${row.original.orderItem.order.id}`}
            className="font-medium hover:underline"
          >
            {row.original.orderItem.order.title}
          </Link>
        ),
      },
      {
        id: "measure",
        accessorFn: (row) => row.orderItem.measure.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мера" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/measures/${row.original.orderItem.measure.id}/edit`}
            className="hover:underline"
          >
            {row.original.orderItem.measure.name}
          </Link>
        ),
      },
      {
        id: "currentDue",
        accessorFn: (row) => row.orderItem.dueAt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Текущий срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.orderItem.dueAt), "dd.MM.yyyy"),
      },
      {
        accessorKey: "requestedDueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Запрошенный срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.requestedDueAt), "dd.MM.yyyy"),
      },
      {
        accessorKey: "justification",
        header: "Обоснование",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-xs text-muted-foreground">
            {row.original.justification ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Запрошено" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy HH:mm"),
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
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.status === DelayRequestStatus.PENDING ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={processingId === row.original.id}
                onClick={() => void reviewDelay(row.original.id, "approve")}
              >
                Одобрить
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={processingId === row.original.id}
                onClick={() => void reviewDelay(row.original.id, "reject")}
              >
                Отклонить
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [processingId, reviewDelay]
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
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
