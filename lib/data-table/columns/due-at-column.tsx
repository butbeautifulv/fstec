import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { colMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { format } from "date-fns"

export function createDueAtColumn<TRow>(
  accessorKey: keyof TRow & string,
  title = "Срок"
): ColumnDef<TRow> {
  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    sortingFn: dateSortFn,
    cell: ({ row }) =>
      format(new Date(String(row.original[accessorKey])), "dd.MM.yyyy"),
    meta: colMeta(title, { valueType: "date", cellClassName: "w-28" }),
  }
}
