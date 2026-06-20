import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

export const ORDER_ITEM_DETAIL_INCLUDE = {
  measure: true,
  status: true,
  subdivision: true,
  order: {
    select: {
      id: true,
      title: true,
      issuedAt: true,
      organization: { select: { id: true, name: true } },
    },
  },
  responses: {
    orderBy: { submittedAt: "desc" as const },
    take: 1,
    include: { attachments: true },
  },
} satisfies Prisma.OrderItemInclude

export type OrderItemDetail = Prisma.OrderItemGetPayload<{
  include: typeof ORDER_ITEM_DETAIL_INCLUDE
}>

export async function fetchOrderItemDetail(
  where: Prisma.OrderItemWhereInput
): Promise<OrderItemDetail | null> {
  return prisma.orderItem.findFirst({
    where,
    include: ORDER_ITEM_DETAIL_INCLUDE,
  })
}

export async function fetchOrderItemDetailById(
  id: number
): Promise<OrderItemDetail | null> {
  return prisma.orderItem.findUnique({
    where: { id },
    include: ORDER_ITEM_DETAIL_INCLUDE,
  })
}
