import { ResponsesTable } from "@/components/platform/responses-table"
import { OrderItemScopedTableSuspense } from "@/components/platform/order-item-scoped-table-section"
import { listResponses } from "@/lib/responses"
import { serializeResponseRows } from "@/lib/serialize/panel"
import { ResponseReviewStatus } from "@prisma/client"

export function ResponsesTableSuspense({
  statusFilter,
}: {
  statusFilter?: ResponseReviewStatus
}) {
  return (
    <OrderItemScopedTableSuspense
      listFn={() => listResponses(statusFilter)}
      serializer={serializeResponseRows}
      renderTable={(rows) => (
        <ResponsesTable initialRows={rows as ReturnType<typeof serializeResponseRows>} />
      )}
    />
  )
}
