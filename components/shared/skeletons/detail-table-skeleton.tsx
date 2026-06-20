import { DataTableShell } from "@/components/platform/data-table-shell"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import {
  PageContentShell,
  TableToolbarSkeleton,
} from "@/components/shared/skeletons/primitives"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function DetailTableSkeleton({
  columns = 8,
  rows = 6,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack showActions />
      <DataTableShell toolbar={<TableToolbarSkeleton />}>
        <TableSkeleton columns={columns} rows={rows} />
      </DataTableShell>
    </PageContentShell>
  )
}
