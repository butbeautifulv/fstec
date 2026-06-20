import { Suspense } from "react"
import { ResponsesTable } from "@/components/platform/responses-table"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { listResponses } from "@/lib/responses"
import { serializeResponseRows } from "@/lib/serialize/panel"
import { ResponseReviewStatus } from "@prisma/client"

async function ResponsesTableSection({
  statusFilter,
}: {
  statusFilter?: ResponseReviewStatus
}) {
  const rows = await listResponses(statusFilter)
  return <ResponsesTable initialRows={serializeResponseRows(rows)} />
}

export function ResponsesTableSuspense({
  statusFilter,
}: {
  statusFilter?: ResponseReviewStatus
}) {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <ResponsesTableSection statusFilter={statusFilter} />
    </Suspense>
  )
}
