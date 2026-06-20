import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { textColumnMeta } from "@/lib/data-table/column-meta"
import { TextCell } from "@/lib/data-table/text-cell"
import { labels } from "@/lib/ui/branding"

export function createOrganizationColumn<TRow>(
  accessor: (row: TRow) => { id: number; name: string },
  href: (org: { id: number; name: string }) => string,
  width = "w-[12%]"
): ColumnDef<TRow> {
  return {
    id: "organization",
    accessorFn: (row) => accessor(row).name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={labels.org} />
    ),
    cell: ({ row }) => {
      const org = accessor(row.original)
      return (
        <TextCell text={org.name} href={href(org)} linkClassName="font-normal" />
      )
    },
    enableColumnFilter: true,
    filterFn: facetedFilter,
    meta: textColumnMeta(labels.org, width),
  }
}
