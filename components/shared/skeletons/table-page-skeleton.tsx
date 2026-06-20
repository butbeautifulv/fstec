import { DataTableShell } from "@/components/platform/data-table-shell"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import {
  PageContentShell,
  TableToolbarSkeleton,
} from "@/components/shared/skeletons/primitives"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function TablePageSkeleton({
  columns = 5,
  rows = 10,
  showActions = false,
}: {
  columns?: number
  rows?: number
  showActions?: boolean
}) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showActions={showActions} />
      <DataTableShell toolbar={<TableToolbarSkeleton />}>
        <TableSkeleton columns={columns} rows={rows} />
      </DataTableShell>
    </PageContentShell>
  )
}
