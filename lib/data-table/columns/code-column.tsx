import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { colMeta } from "@/lib/data-table/column-meta"

export function createCodeColumn<TRow>(
  accessor: (row: TRow) => string | null,
  opts?: { title?: string; cellClassName?: string; mono?: boolean }
): ColumnDef<TRow> {
  const title = opts?.title ?? "Код"
  const cellClassName = opts?.cellClassName ?? "w-24"
  const mono = opts?.mono ?? true

  return {
    id: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    accessorFn: (row) => accessor(row) ?? "—",
    cell: ({ row }) => {
      const value = accessor(row.original) ?? "—"
      return mono ? (
        <span className="font-mono text-muted-foreground">{value}</span>
      ) : (
        <span>{value}</span>
      )
    },
    enableColumnFilter: false,
    meta: colMeta(title, { faceted: false, cellClassName }),
  }
}
