"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/admin/crud/confirm-delete-alert"
import { EditOrderDialog } from "@/components/admin/crud/edit-order-dialog"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { TableRowActions } from "@/components/admin/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { facetedFilter, FACETED_COLUMN_META } from "@/lib/data-table/faceted-column"
import { dateSortFn, numberSortFn } from "@/lib/data-table/sort-helpers"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { ExternalLink, Pencil, Trash2 } from "lucide-react"

type Order = {
  id: number
  title: string
  issuedAt: string
  organization: { name: string }
  _count: { items: number }
}

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/orders/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteId))
      setDeleteId(null)
      router.refresh()
      notify.success("Поручение удалено")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось удалить поручение")
    }
  }

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "organization",
        accessorFn: (row) => row.organization.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => row.original.organization.name,
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: { ...FACETED_COLUMN_META, title: labels.org },
      },
      {
        id: "items",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мер" />
        ),
        accessorFn: (row) => row._count.items,
        sortingFn: numberSortFn,
        cell: ({ row }) => row.original._count.items,
      },
      {
        accessorKey: "issuedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Дата" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.issuedAt), "dd.MM.yyyy"),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <TableRowActions
            actions={[
              {
                label: "Открыть",
                icon: <ExternalLink data-icon="inline-start" />,
                href: `/admin/orders/${row.original.id}`,
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
                onClick: () => setDeleteId(row.original.id),
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
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить поручение?"
        description="Поручение и все его позиции будут удалены без возможности восстановления."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
