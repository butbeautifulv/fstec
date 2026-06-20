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
  showBack = false,
  showActions = false,
}: {
  columns?: number
  rows?: number
  showBack?: boolean
  showActions?: boolean
}) {
  return (
    <PageContentShell>
      <PageHeaderSkeleton showBack={showBack} showActions={showActions} />
      <DataTableShell toolbar={<TableToolbarSkeleton />}>
        <TableSkeleton columns={columns} rows={rows} />
      </DataTableShell>
    </PageContentShell>
  )
}

export function PublicTablePageSkeleton({
  columns = 5,
  rows = 8,
}: {
  columns?: number
  rows?: number
}) {
  return <TablePageSkeleton columns={columns} rows={rows} showBack />
}
