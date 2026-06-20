import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { textColumnMeta } from "@/lib/data-table/column-meta"
import { TextCell } from "@/lib/data-table/text-cell"

export function createMeasureColumn<TRow>(
  accessor: (row: TRow) => { id: number; name: string },
  href: (measure: { id: number; name: string }) => string,
  opts?: {
    width?: string
    linkClassName?: string
    title?: string
    hrefFromRow?: (row: TRow) => string
  }
): ColumnDef<TRow> {
  const width = opts?.width ?? "min-w-[10rem] w-[32%]"
  const title = opts?.title ?? "Мера"
  return {
    id: "measure",
    accessorFn: (row) => accessor(row).name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ row }) => {
      const measure = accessor(row.original)
      const cellHref = opts?.hrefFromRow
        ? opts.hrefFromRow(row.original)
        : href(measure)
      return (
        <TextCell
          text={measure.name}
          href={cellHref}
          linkClassName={opts?.linkClassName ?? "font-normal"}
        />
      )
    },
    meta: textColumnMeta(title, width),
  }
}
