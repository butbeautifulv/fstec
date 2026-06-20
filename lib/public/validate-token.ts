import { cache } from "react"
import { prisma } from "@/lib/db"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import { fetchOrderItemDetail } from "@/lib/order-items/fetch-detail"

function itemScopeWhere(link: {
  organizationId: number
  subdivisionId: number | null
}) {
  return {
    order: { organizationId: link.organizationId },
    ...(link.subdivisionId != null ? { subdivisionId: link.subdivisionId } : {}),
  }
}

const loadAccessLink = cache(async (token: string) => {
  const link = await prisma.accessLink.findUnique({
    where: { token },
    include: {
      organization: true,
      subdivision: true,
    },
  })

  if (!link || !isRevocableLinkActive(link)) return null

  return {
    link,
    organization: link.organization,
    subdivision: link.subdivision,
  }
})

export async function validateAccessLink(token: string) {
  return loadAccessLink(token)
}

export const fetchPublicNavOrders = cache(async (token: string) => {
  const ctx = await loadAccessLink(token)
  if (!ctx) return null

  const rows = await prisma.orderItem.findMany({
    where: itemScopeWhere(ctx.link),
    select: { id: true, orderId: true },
    orderBy: [{ order: { issuedAt: "desc" } }, { id: "asc" }],
  })

  const byOrder = new Map<number, { id: number }[]>()
  for (const row of rows) {
    const items = byOrder.get(row.orderId) ?? []
    items.push({ id: row.id })
    byOrder.set(row.orderId, items)
  }

  const navOrders = [...byOrder.entries()].map(([orderId, items]) => ({
    items,
    orderId,
  }))

  return { ...ctx, navOrders }
})

export const fetchPublicOrderSummaries = cache(async (token: string) => {
  const ctx = await loadAccessLink(token)
  if (!ctx) return null

  const orders = await prisma.order.findMany({
    where: {
      organizationId: ctx.link.organizationId,
      items: {
        some: itemScopeWhere(ctx.link),
      },
    },
    select: {
      id: true,
      title: true,
      issuedAt: true,
      _count: {
        select: {
          items: {
            where: itemScopeWhere(ctx.link),
          },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  })

  return {
    ...ctx,
    orders: orders
      .filter((order) => order._count.items > 0)
      .map((order) => ({
        id: order.id,
        title: order.title,
        issuedAt: order.issuedAt,
        itemCount: order._count.items,
      })),
  }
})

/** @deprecated Prefer validateAccessLink + targeted fetch helpers */
export const validateAccessToken = cache(async (token: string) => {
  const ctx = await fetchPublicOrderSummaries(token)
  if (!ctx) return null

  const items = await prisma.orderItem.findMany({
    where: itemScopeWhere(ctx.link),
    include: {
      measure: true,
      status: true,
      subdivision: true,
      order: { select: { id: true, title: true, issuedAt: true } },
      responses: { orderBy: { submittedAt: "desc" }, take: 1 },
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

  return {
    link: ctx.link,
    organization: ctx.organization,
    subdivision: ctx.subdivision,
    orders,
  }
})

export async function getOrderForToken(token: string, orderId: number) {
  const ctx = await validateAccessLink(token)
  if (!ctx) return null

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      organizationId: ctx.link.organizationId,
      items: { some: itemScopeWhere(ctx.link) },
    },
    include: {
      items: {
        where: itemScopeWhere(ctx.link),
        include: {
          measure: true,
          status: true,
          subdivision: true,
        },
        orderBy: [{ measure: { name: "asc" } }],
      },
    },
  })

  if (!order || order.items.length === 0) return null

  return {
    link: ctx.link,
    organization: ctx.organization,
    subdivision: ctx.subdivision,
    order,
  }
}

export async function getPublicOrderItem(token: string, orderItemId: number) {
  const ctx = await validateAccessLink(token)
  if (!ctx) throw new Error("NOT_FOUND")

  const item = await fetchOrderItemDetail({
    id: orderItemId,
    ...itemScopeWhere(ctx.link),
  })

  if (!item) throw new Error("NOT_FOUND")

  return {
    link: ctx.link,
    organization: ctx.organization,
    subdivision: ctx.subdivision,
    item,
  }
}
