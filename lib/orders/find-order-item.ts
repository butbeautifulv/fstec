import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

export async function findOrderItem<T extends Prisma.OrderItemInclude>(
  orderId: number,
  itemId: number,
  include: T
) {
  return prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include,
  })
}
