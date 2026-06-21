import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { colMeta } from "@/lib/data-table/column-meta"
import { TextCell } from "@/lib/data-table/text-cell"

export function createSubdivisionColumn<TRow>(
  accessor: (row: TRow) => { id: number; name: string } | null | undefined,
  href?: (sub: { id: number; name: string }, row: TRow) => string | undefined,
  width = "w-[14%]",
  columnId = "subdivisionName"
): ColumnDef<TRow> {
  return {
    id: columnId,
    accessorFn: (row) => accessor(row)?.name ?? "—",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Подразделение" />
    ),
    cell: ({ row }) => {
      const sub = accessor(row.original)
      const label = sub?.name ?? "—"
      const link = sub && href ? href(sub, row.original) : undefined
      return <TextCell text={label} href={link} />
    },
    enableColumnFilter: true,
    filterFn: facetedFilter,
    meta: colMeta("Подразделение", { cellClassName: `max-w-0 ${width}` }),
  }
}
