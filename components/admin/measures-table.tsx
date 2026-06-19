"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/admin/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { TableRowActions } from "@/components/admin/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"

type Measure = {
  id: number
  name: string
  code: string | null
  createdAt: string
}

export function MeasuresTable({ initialMeasures }: { initialMeasures: Measure[] }) {
  const router = useRouter()
  const [measures, setMeasures] = useState(initialMeasures)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/measures/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setMeasures((prev) => prev.filter((m) => m.id !== deleteId))
      setDeleteId(null)
      router.refresh()
      notify.success("Мера удалена")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось удалить меру")
    }
  }

  const columns = useMemo<ColumnDef<Measure>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/measures/${row.original.id}/edit`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        cell: ({ row }) => (
          <span className="font-mono">{row.original.code ?? "—"}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Создана" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
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
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                href: `/admin/measures/${row.original.id}/edit`,
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
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить меру?"
        description="Мера будет удалена из каталога. Это возможно только если она не используется в поручениях."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
