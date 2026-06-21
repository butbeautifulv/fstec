import { DelayRequestsTable } from "@/components/platform/delay-requests-table"
import { OrderItemScopedTableSuspense } from "@/components/platform/order-item-scoped-table-section"
import { listDelayRequests } from "@/lib/delays"
import { serializeDelayRows } from "@/lib/serialize/panel"
import { DelayRequestStatus } from "@prisma/client"

export function DelayRequestsTableSuspense({
  statusFilter,
}: {
  statusFilter?: DelayRequestStatus
}) {
  return (
    <OrderItemScopedTableSuspense
      listFn={() => listDelayRequests(statusFilter)}
      serializer={serializeDelayRows}
      renderTable={(rows) => (
        <DelayRequestsTable initialRows={rows as ReturnType<typeof serializeDelayRows>} />
      )}
    />
  )
}
