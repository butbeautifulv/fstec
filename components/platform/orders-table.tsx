"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EditOrderDialog } from "@/components/platform/crud/edit-order-dialog"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { dateSortFn, numberSortFn } from "@/lib/data-table/sort-helpers"
import { useResourceDelete } from "@/hooks/use-resource-delete"
import { labels } from "@/lib/ui/branding"
import { format } from "date-fns"
import { ExternalLink, Pencil, Trash2 } from "lucide-react"

type Order = {
  id: number
  title: string
  issuedAt: string
  organization: { id: number; name: string }
  _count: { items: number }
}

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const { deleteId, deleting, requestDelete, confirmDelete, cancelDelete } =
    useResourceDelete({
      url: (id) => `/api/orders/${id}`,
      onRemoved: (id) => setOrders((prev) => prev.filter((o) => o.id !== id)),
      successMessage: "Поручение удалено",
      errorMessage: "Не удалось удалить поручение",
    })

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/orders/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
        meta: colMeta("Название"),
      },
      {
        id: "organization",
        accessorFn: (row) => row.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/organizations/${row.original.organization.id}`}
            className="hover:underline"
          >
            {row.original.organization.name}
          </Link>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta(labels.org),
      },
      {
        id: "items",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мер" />
        ),
        accessorFn: (row) => row._count.items,
        sortingFn: numberSortFn,
        cell: ({ row }) => row.original._count.items,
        meta: colMeta("Мер"),
      },
      {
        accessorKey: "issuedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Дата" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.issuedAt), "dd.MM.yyyy"),
        meta: colMeta("Дата", { valueType: "date" }),
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
                label: "Открыть",
                icon: <ExternalLink data-icon="inline-start" />,
                href: `/panel/orders/${row.original.id}`,
              },
              {
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                onClick: () => setEditOrder(row.original),
              },
              {
                label: "Удалить",
                icon: <Trash2 data-icon="inline-start" />,
                destructive: true,
                onClick: () => requestDelete(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Поиск по названию или организации…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [row.title, row.organization.name].join(" ").toLowerCase().includes(q)
        }}
        empty={
          <EmptyTableState
            title="Нет поручений"
            description={`Создайте первое поручение для ${labels.orgGenitive}`}
          />
        }
      />

      <EditOrderDialog
        order={editOrder ? { id: editOrder.id, title: editOrder.title } : null}
        open={editOrder !== null}
        onOpenChange={(o) => !o && setEditOrder(null)}
        onSaved={(updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, title: updated.title } : o))
          )
          router.refresh()
        }}
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && cancelDelete()}
        title="Удалить поручение?"
        description="Поручение и все его позиции будут удалены без возможности восстановления."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
