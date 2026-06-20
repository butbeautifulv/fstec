import type { ScopedDashboardItem } from "@/lib/dashboard/fetch-scoped-items"
import { isOrderItemOverdue } from "@/lib/statuses/workflow"

export function buildMatrixFromItems(items: ScopedDashboardItem[], now: Date) {
  return items.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    dueAt: item.dueAt,
    isOverdue: isOrderItemOverdue(item, now),
    measure: item.measure,
    order: {
      title: item.order.title,
      issuedAt: item.order.issuedAt,
      organization: item.order.organization,
    },
    status: item.status,
    subdivision: item.subdivision,
  }))
}

export type DashboardMatrixItem = ReturnType<typeof buildMatrixFromItems>[number]
