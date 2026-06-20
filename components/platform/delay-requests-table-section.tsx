import { Suspense } from "react"
import { DelayRequestsTable } from "@/components/platform/delay-requests-table"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { listDelayRequests } from "@/lib/delays"
import { serializeDelayRows } from "@/lib/serialize/panel"
import { DelayRequestStatus } from "@prisma/client"

async function DelayRequestsTableSection({
  statusFilter,
}: {
  statusFilter?: DelayRequestStatus
}) {
  const rows = await listDelayRequests(statusFilter)
  return <DelayRequestsTable initialRows={serializeDelayRows(rows)} />
}

export function DelayRequestsTableSuspense({
  statusFilter,
}: {
  statusFilter?: DelayRequestStatus
}) {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <DelayRequestsTableSection statusFilter={statusFilter} />
    </Suspense>
  )
}
