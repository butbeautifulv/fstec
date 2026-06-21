import type { DashboardMatrixItem } from "@/lib/dashboard/build-matrix"
import type { SerializedMatrixItem } from "@/lib/dashboard/serialize-dashboard"
import type { PublicItem } from "@/lib/public/types"

type OrderItemInput = {
  id: number
  dueAt: Date
  measure: {
    name: string
    code: string | null
    description: string | null
  }
  status: { id: number; name: string; isTerminal: boolean }
  subdivision?: { id: number; name: string } | null
}

type OrderInput = {
  id: number
  title: string
  issuedAt: Date
}

export function mapOrderItemsToPublicItems(
  order: OrderInput,
  items: OrderItemInput[]
): PublicItem[] {
  return items.map((item) => ({
    id: item.id,
    orderId: order.id,
    dueAt: item.dueAt.toISOString(),
    measure: {
      name: item.measure.name,
      code: item.measure.code,
      description: item.measure.description,
    },
    status: {
      id: item.status.id,
      name: item.status.name,
      isTerminal: item.status.isTerminal,
    },
    orderTitle: order.title,
    orderIssuedAt: order.issuedAt.toISOString(),
    subdivisionName: item.subdivision?.name ?? null,
    subdivisionId: item.subdivision?.id ?? null,
  }))
}

export function mapOrdersToPublicItems(
  orders: { id: number; title: string; issuedAt: Date; items: OrderItemInput[] }[]
): PublicItem[] {
  return orders.flatMap((order) => mapOrderItemsToPublicItems(order, order.items))
}

export function mapMatrixItemToPublicItem(
  item: DashboardMatrixItem | SerializedMatrixItem
): PublicItem {
  const dueAt = typeof item.dueAt === "string" ? item.dueAt : item.dueAt.toISOString()
  const issuedAt =
    typeof item.order.issuedAt === "string"
      ? item.order.issuedAt
      : item.order.issuedAt.toISOString()

  return {
    id: item.id,
    orderId: item.orderId,
    dueAt,
    measure: {
      name: item.measure.name,
      code: item.measure.code,
      description: item.measure.description,
    },
    status: {
      id: item.status.id,
      name: item.status.name,
      isTerminal: item.status.isTerminal,
    },
    orderTitle: item.order.title,
    orderIssuedAt: issuedAt,
    subdivisionName: item.subdivision?.name ?? null,
    subdivisionId: item.subdivision?.id ?? null,
  }
}

export function mapSerializedMatrixToPublicItems(
  items: SerializedMatrixItem[]
): PublicItem[] {
  return items.map(mapMatrixItemToPublicItem)
}
