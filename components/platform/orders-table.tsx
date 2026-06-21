"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { colMeta, actionsColumnMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { createOrganizationColumn } from "@/lib/data-table/columns"
import { dateSortFn, numberSortFn } from "@/lib/data-table/sort-helpers"
import { TextCell } from "@/lib/data-table/text-cell"
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

export function OrdersTable({
  initialOrders,
  sourceImportId = null,
}: {
  initialOrders: Order[]
  sourceImportId?: number | null
}) {
  const [orders, setOrders] = useState(initialOrders)
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
          <TextCell
            text={row.original.title}
            href={`/panel/orders/${row.original.id}`}
          />
        ),
        meta: textColumnMeta("Название", "w-[28%]"),
      },
      createOrganizationColumn<Order>(
        (row) => row.organization,
        (org) => `/panel/organizations/${org.id}`,
        "w-[20%]"
      ),
      {
        id: "items",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мер" />
        ),
        accessorFn: (row) => row._count.items,
        sortingFn: numberSortFn,
        cell: ({ row }) => row.original._count.items,
        meta: colMeta("Мер", { cellClassName: "w-20" }),
      },
      {
        accessorKey: "issuedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Дата" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.issuedAt), "dd.MM.yyyy"),
        meta: colMeta("Дата", { valueType: "date", cellClassName: "w-28" }),
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
                href: `/panel/orders/${row.original.id}/edit`,
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
    [requestDelete]
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
