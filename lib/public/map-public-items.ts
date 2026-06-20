import type { PublicItem } from "@/components/public/public-measures-table"

type OrderItemInput = {
  id: number
  dueAt: Date
  measure: {
    name: string
    code: string | null
    description: string | null
  }
  status: { id: number; name: string; isTerminal: boolean }
  subdivision?: { name: string } | null
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
  }))
}

export function mapOrdersToPublicItems(
  orders: { id: number; title: string; issuedAt: Date; items: OrderItemInput[] }[]
): PublicItem[] {
  return orders.flatMap((order) => mapOrderItemsToPublicItems(order, order.items))
}
