"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { useAdminBreadcrumbLabel } from "@/components/platform/platform-breadcrumb"
import { EditOrderDialog } from "@/components/platform/crud/edit-order-dialog"
import { EditOrderItemDialog } from "@/components/platform/crud/edit-order-item-dialog"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { DelayListDialog } from "@/components/platform/delay-list-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import {
  getDisplayStatusName,
  isOrderItemOverdue,
} from "@/lib/statuses/workflow"
import { format } from "date-fns"
import { ChevronRightIcon, Pencil, Trash2 } from "lucide-react"

type Status = { id: number; name: string; isTerminal?: boolean }
type Subdivision = { id: number; name: string }

type Response = {
  id: number
  result: string
  commentary: string | null
  submittedByLabel: string | null
  submittedAt: string
}

type DelayRequest = {
  id: number
  status: string
  requestedDueAt: string
  justification: string | null
  createdAt: string
}

type OrderItem = {
  id: number
  dueAt: string
  measure: { id: number; name: string }
  status: { id: number; name: string; isTerminal: boolean }
  subdivision: { id: number; name: string } | null
  delayRequests: DelayRequest[]
  responses: Response[]
}

type OrderDetail = {
  id: number
  title: string
  organization: { id: number; name: string; subdivisions: Subdivision[] }
  items: OrderItem[]
}

export function OrderDetailClient({
  order: initialOrder,
  statuses,
}: {
  order: OrderDetail
  statuses: Status[]
}) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [delayItemId, setDelayItemId] = useState<number | null>(null)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [editItem, setEditItem] = useState<OrderItem | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useAdminBreadcrumbLabel(order.title)

  const delayItem = order.items.find((i) => i.id === delayItemId)

  const pendingCount = (item: OrderItem) =>
    item.delayRequests.filter((d) => d.status === "PENDING").length

  async function confirmDeleteItem() {
    if (!deleteItemId) return
    setDeleting(true)
    const res = await fetch(`/api/orders/${order.id}/items/${deleteItemId}`, {
      method: "DELETE",
    })
    setDeleting(false)
    if (res.ok) {
      setOrder((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== deleteItemId),
      }))
      setDeleteItemId(null)
      router.refresh()
      notify.success("Позиция удалена")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось удалить позицию")
    }
  }

  const itemColumns = useMemo<ColumnDef<OrderItem>[]>(
    () => [
      {
        id: "measure",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мера" />
        ),
        accessorFn: (row) => row.measure.name,
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
        id: "subdivision",
        accessorFn: (row) => row.subdivision?.name ?? "—",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Подразделение" />
        ),
        cell: ({ row }) => row.original.subdivision?.name ?? "—",
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Подразделение"),
      },
      {
        id: "status",
        accessorFn: (row) => getDisplayStatusName(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => {
          const isOverdue = isOrderItemOverdue(row.original)
          return (
            <Badge variant={isOverdue ? "destructive" : "secondary"}>
              {getDisplayStatusName(row.original)}
            </Badge>
          )
        },
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
      {
        id: "reports",
        header: "Отчёты",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const { responses } = row.original
          if (responses.length === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          if (responses.length === 1) {
            return (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/panel/responses/${responses[0].id}`}>
                  1 отчёт
                  <ChevronRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            )
          }
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {responses.length} отчёта
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {responses.map((response) => (
                    <DropdownMenuItem key={response.id} asChild>
                      <Link href={`/panel/responses/${response.id}`}>
                        {format(new Date(response.submittedAt), "dd.MM.yyyy HH:mm")}
                        {response.submittedByLabel
                          ? ` · ${response.submittedByLabel}`
                          : ""}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        id: "delays",
        header: "Переносы",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.delayRequests.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDelayItemId(row.original.id)}
            >
              {row.original.delayRequests.length}
              {pendingCount(row.original) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount(row.original)}
                </Badge>
              )}
            </Button>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        meta: actionsColumnMeta(),
        cell: ({ row }) => (
          <TableRowActions
            actions={[
              {
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                onClick: () => setEditItem(row.original),
              },
              {
                label: "Удалить",
                icon: <Trash2 data-icon="inline-start" />,
                destructive: true,
                onClick: () => setDeleteItemId(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={order.title}
        description={
          <Link
            href={`/panel/organizations/${order.organization.id}`}
            className="hover:underline"
          >
            {order.organization.name}
          </Link>
        }
        backHref="/panel/orders"
        backLabel="Поручения"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOrderOpen(true)}>
              Изменить поручение
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/panel/organizations/${order.organization.id}`}>
                Ссылки {labels.orgGenitive}
              </Link>
            </Button>
          </div>
        }
      />

      <DataTable
        columns={itemColumns}
        data={order.items}
        searchPlaceholder="Поиск по мере или подразделению…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [row.measure.name, row.subdivision?.name ?? "", getDisplayStatusName(row)]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        empty={
          <EmptyTableState title="Нет позиций" description="В поручении нет мер" />
        }
      />

      <EditOrderDialog
        order={{ id: order.id, title: order.title }}
        open={editOrderOpen}
        onOpenChange={setEditOrderOpen}
        onSaved={(updated) => {
          setOrder((prev) => ({ ...prev, title: updated.title }))
          router.refresh()
        }}
      />

      <EditOrderItemDialog
        orderId={order.id}
        item={editItem}
        statuses={statuses}
        subdivisions={order.organization.subdivisions}
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
        onSaved={(updated) => {
          setOrder((prev) => ({
            ...prev,
            items: prev.items.map((i) =>
              i.id === updated.id
                ? {
                    ...i,
                    dueAt: updated.dueAt,
                    status: {
                      id: updated.status.id,
                      name: updated.status.name,
                      isTerminal: updated.status.isTerminal ?? i.status.isTerminal ?? false,
                    },
                    subdivision: updated.subdivision,
                  }
                : i
            ),
          }))
          router.refresh()
        }}
      />

      <ConfirmDeleteAlert
        open={deleteItemId !== null}
        onOpenChange={(o) => !o && setDeleteItemId(null)}
        title="Удалить позицию?"
        description="Позиция будет удалена из поручения вместе с отчётами и запросами переноса."
        onConfirm={confirmDeleteItem}
        loading={deleting}
      />

      {delayItem && (
        <DelayListDialog
          open={delayItemId !== null}
          onOpenChange={(o) => !o && setDelayItemId(null)}
          measureName={delayItem.measure.name}
          delayRequests={delayItem.delayRequests}
        />
      )}
    </div>
  )
}
