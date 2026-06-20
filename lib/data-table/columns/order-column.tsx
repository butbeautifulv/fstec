import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { textColumnMeta } from "@/lib/data-table/column-meta"
import { TextCell } from "@/lib/data-table/text-cell"

export function createOrderColumn<TRow>(
  accessor: (row: TRow) => { id: number; title: string },
  href: (order: { id: number; title: string }) => string,
  width = "w-[16%]"
): ColumnDef<TRow> {
  return {
    id: "order",
    accessorFn: (row) => accessor(row).title,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Поручение" />
    ),
    cell: ({ row }) => {
      const order = accessor(row.original)
      return <TextCell text={order.title} href={href(order)} />
    },
    enableColumnFilter: true,
    filterFn: facetedFilter,
    meta: textColumnMeta("Поручение", width),
  }
}
