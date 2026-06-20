import { DataTableShell } from "@/components/platform/data-table-shell"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import {
  PageContentShell,
  TableToolbarSkeleton,
} from "@/components/shared/skeletons/primitives"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function PublicTablePageSkeleton({
  columns = 5,
  rows = 8,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack />
      <DataTableShell toolbar={<TableToolbarSkeleton />}>
        <TableSkeleton columns={columns} rows={rows} />
      </DataTableShell>
    </PageContentShell>
  )
}
