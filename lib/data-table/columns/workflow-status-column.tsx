import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { colMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"

export type WorkflowStatusRow = {
  isOverdue: boolean
  displayStatus: string
}

export function createWorkflowStatusColumn<TRow extends WorkflowStatusRow>(
  getStatus: (row: TRow) => WorkflowStatusRow = (row) => row,
  opts?: { title?: string; cellClassName?: string }
): ColumnDef<TRow> {
  const title = opts?.title ?? "Статус"
  const cellClassName = opts?.cellClassName ?? "w-32"

  return {
    id: "status",
    accessorFn: (row) => getStatus(row).displayStatus,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ row }) => {
      const { isOverdue, displayStatus } = getStatus(row.original)
      return (
        <Badge variant={isOverdue ? "destructive" : "secondary"}>
          {displayStatus}
        </Badge>
      )
    },
    enableColumnFilter: true,
    filterFn: facetedFilter,
    meta: colMeta(title, { cellClassName }),
  }
}

export function createMatrixWorkflowStatusColumn<TRow>(
  getDisplayStatus: (row: TRow) => string,
  getIsOverdue: (row: TRow) => boolean,
  opts?: { title?: string; cellClassName?: string }
): ColumnDef<TRow> {
  const title = opts?.title ?? "Статус"
  const cellClassName = opts?.cellClassName ?? "w-32"

  return {
    id: "status",
    accessorFn: getDisplayStatus,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ row }) => (
      <Badge variant={getIsOverdue(row.original) ? "destructive" : "secondary"}>
        {getDisplayStatus(row.original)}
      </Badge>
    ),
    enableColumnFilter: true,
    filterFn: facetedFilter,
    meta: colMeta(title, { cellClassName }),
  }
}
