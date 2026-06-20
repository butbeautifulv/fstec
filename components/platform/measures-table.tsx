"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { useResourceDelete } from "@/hooks/use-resource-delete"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"

type Measure = {
  id: number
  name: string
  code: string | null
  createdAt: string
}

export function MeasuresTable({ initialMeasures }: { initialMeasures: Measure[] }) {
  const [measures, setMeasures] = useState(initialMeasures)
  const { deleteId, deleting, requestDelete, confirmDelete, cancelDelete } =
    useResourceDelete({
      url: (id) => `/api/measures/${id}`,
      onRemoved: (id) => setMeasures((prev) => prev.filter((m) => m.id !== id)),
      successMessage: "Мера удалена",
      errorMessage: "Не удалось удалить меру",
    })

  const columns = useMemo<ColumnDef<Measure>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/panel/measures/${row.original.id}/edit`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
        meta: colMeta("Название"),
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        cell: ({ row }) => (
          <span className="font-mono">{row.original.code ?? "—"}</span>
        ),
        meta: colMeta("Код"),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Создана" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
        meta: colMeta("Создана", { valueType: "date" }),
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
                href: `/panel/measures/${row.original.id}/edit`,
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
        data={measures}
        searchPlaceholder="Поиск по названию или коду…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [row.name, row.code ?? ""].join(" ").toLowerCase().includes(q)
        }}
        empty={
          <EmptyTableState
            title="Нет мер"
            description="Добавьте первую меру в каталог ФСТЭК"
          />
        }
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && cancelDelete()}
        title="Удалить меру?"
        description="Мера будет удалена из каталога. Это возможно только если она не используется в поручениях."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
