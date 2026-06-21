"use client"

import { useCallback, useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { XIcon } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import type { OrderCreateMeasure } from "@/components/platform/order-create-draft"
import { colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TruncatedCell } from "@/lib/data-table/text-cell"

export function SelectedMeasuresTable({
  measures,
  onRemove,
}: {
  measures: OrderCreateMeasure[]
  onRemove: (id: number) => void
}) {
  const handleRemove = useCallback(
    (id: number) => {
      onRemove(id)
    },
    [onRemove]
  )

  const columns = useMemo<ColumnDef<OrderCreateMeasure>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        cell: ({ row }) => <TruncatedCell text={row.original.name} />,
        meta: textColumnMeta("Название", "w-[45%]"),
      },
      {
        id: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        accessorFn: (row) => row.code ?? "—",
        cell: ({ row }) => (
          <TruncatedCell
            text={row.original.code ?? "—"}
            className="font-mono text-muted-foreground"
          />
        ),
        enableColumnFilter: false,
        meta: colMeta("Код", { faceted: false, cellClassName: "max-w-0 w-[25%]" }),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Создана" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
        meta: colMeta("Создана", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        id: "remove",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        meta: colMeta("", { faceted: false, cellClassName: "w-12 px-0 text-center" }),
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Убрать ${row.original.name}`}
            onClick={() => handleRemove(row.original.id)}
          >
            <XIcon />
          </Button>
        ),
      },
    ],
    [handleRemove]
  )

  return (
    <DataTable
      columns={columns}
      data={measures}
      searchPlaceholder="Поиск среди выбранных…"
      showColumnToggle={false}
      pageSize={10}
      initialSorting={[{ id: "name", desc: false }]}
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return [row.name, row.code ?? ""].join(" ").toLowerCase().includes(q)
      }}
      empty={
        <p className="py-6 text-center text-sm text-muted-foreground">
          Меры не выбраны. Нажмите «Выбрать меры», чтобы добавить из каталога.
        </p>
      }
    />
  )
}
