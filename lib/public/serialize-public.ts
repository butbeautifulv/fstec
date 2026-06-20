import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"
import type { MeasuresTableItem } from "@/lib/measures/table-types"
import type { PublicItem, PublicStatus } from "@/lib/public/types"

export function serializePublicStatuses(
  statuses: { id: number; name: string; isTerminal: boolean }[]
): PublicStatus[] {
  return statuses.map((status) => ({
    id: status.id,
    name: status.name,
    isTerminal: status.isTerminal,
  }))
}

export function serializePublicOrderSummary(order: {
  id: number
  title: string
  issuedAt: Date | string
  itemCount: number
}) {
  return {
    id: order.id,
    title: order.title,
    issuedAt:
      typeof order.issuedAt === "string"
        ? order.issuedAt
        : order.issuedAt.toISOString(),
    itemCount: order.itemCount,
  }
}

export function serializePublicOrderDetail(order: {
  id: number
  title: string
  issuedAt: Date | string
}) {
  return {
    id: order.id,
    title: order.title,
    issuedAt:
      typeof order.issuedAt === "string"
        ? order.issuedAt
        : order.issuedAt.toISOString(),
  }
}

export function serializeOrderListRow(order: {
  id: number
  title: string
  issuedAt: Date | string
  itemCount?: number
  _count?: { items: number }
}): OrderListRow {
  return serializePublicOrderSummary({
    id: order.id,
    title: order.title,
    issuedAt: order.issuedAt,
    itemCount: order.itemCount ?? order._count?.items ?? 0,
  })
}

export function serializeOrderListRows(
  orders: {
    id: number
    title: string
    issuedAt: Date | string
    itemCount?: number
    _count?: { items: number }
  }[]
): OrderListRow[] {
  return orders.map(serializeOrderListRow)
}

export function serializeMeasuresTableItems(items: PublicItem[]): MeasuresTableItem[] {
  return items
}
