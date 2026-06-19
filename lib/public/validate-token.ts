import { prisma } from "@/lib/db"

export async function validateAccessToken(token: string) {
  const link = await prisma.accessLink.findUnique({
    where: { token },
    include: {
      organization: { include: { subdivisions: true } },
      subdivision: true,
    },
  })

  if (!link) return null
  if (link.revokedAt) return null
  if (link.expiresAt && link.expiresAt < new Date()) return null

  const items = await prisma.orderItem.findMany({
    where: {
      order: { organizationId: link.organizationId },
      ...(link.subdivisionId != null
        ? { subdivisionId: link.subdivisionId }
        : {}),
    },
    include: {
      measure: true,
      status: true,
      subdivision: true,
      order: { select: { id: true, title: true, issuedAt: true } },
      responses: { orderBy: { submittedAt: "desc" } },
      delayRequests: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ order: { issuedAt: "desc" } }, { id: "asc" }],
  })

  const ordersMap = new Map<
    number,
    {
      id: number
      title: string
      issuedAt: Date
      items: typeof items
    }
  >()

  for (const item of items) {
    const existing = ordersMap.get(item.order.id)
    if (existing) {
      existing.items.push(item)
    } else {
      ordersMap.set(item.order.id, {
        id: item.order.id,
        title: item.order.title,
        issuedAt: item.order.issuedAt,
        items: [item],
      })
    }
  }

  const orders = [...ordersMap.values()].sort(
    (a, b) => b.issuedAt.getTime() - a.issuedAt.getTime()
  )

  return { link, organization: link.organization, subdivision: link.subdivision, orders }
}

export async function getOrderItemForToken(
  token: string,
  orderItemId: number
) {
  const ctx = await validateAccessToken(token)
  if (!ctx) throw new Error("NOT_FOUND")

  const item = ctx.orders.flatMap((o) => o.items).find((i) => i.id === orderItemId)
  if (!item) throw new Error("NOT_FOUND")

  return { link: ctx.link, item, orders: ctx.orders }
}
