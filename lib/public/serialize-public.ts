import type { PublicStatus } from "@/lib/public/types"

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
