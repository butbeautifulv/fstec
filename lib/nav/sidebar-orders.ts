import { prisma } from "@/lib/db"

export async function listSidebarOrders(limit = 50) {
  return prisma.order.findMany({
    orderBy: { issuedAt: "desc" },
    take: limit,
    select: { id: true, title: true },
  })
}
