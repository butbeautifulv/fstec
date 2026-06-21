import { DataTableShell } from "@/components/platform/data-table-shell"
import { TableToolbarSkeleton } from "@/components/shared/skeletons/primitives"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function TableOnlySkeleton({
  columns = 5,
  rows = 10,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <DataTableShell toolbar={<TableToolbarSkeleton />}>
      <TableSkeleton columns={columns} rows={rows} />
    </DataTableShell>
  )
}
