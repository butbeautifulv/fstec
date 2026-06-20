import { DataTableShell } from "@/components/platform/data-table-shell"
import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton"
import {
  ChartsGridSkeleton,
  PageContentShell,
  StatCardsGridSkeleton,
  TableToolbarSkeleton,
} from "@/components/shared/skeletons/primitives"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function DashboardPageSkeleton({ showReportLink = false }: { showReportLink?: boolean }) {
  return (
    <PageContentShell>
      {showReportLink && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-36" />
          </CardContent>
        </Card>
      )}
      <PageHeaderSkeleton showActions />
      <StatCardsGridSkeleton />
      <ChartsGridSkeleton />
      <DataTableShell toolbar={<TableToolbarSkeleton />}>
        <TableSkeleton columns={5} rows={8} />
      </DataTableShell>
    </PageContentShell>
  )
}
