import "server-only"

import { cache } from "react"
import { getCachedJson } from "@/lib/cache/json-cache"
import { prismaRead } from "@/lib/db"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import { fetchOrderItemDetail } from "@/lib/order-items/fetch-detail"

const ACCESS_LINK_CACHE_TTL_SECONDS = 300

type AccessLinkRecord = {
  id: number
  token: string
  organizationId: number
  subdivisionId: number | null
  revokedAt: Date | null
  expiresAt: Date | null
}

type AccessLinkContext = {
  link: AccessLinkRecord
  organization: { id: number; name: string }
  subdivision: { id: number; name: string } | null
}

type SerializedAccessLinkContext = {
  link: {
    id: number
    token: string
    organizationId: number
    subdivisionId: number | null
    revokedAt: string | null
    expiresAt: string | null
  }
  organization: { id: number; name: string }
  subdivision: { id: number; name: string } | null
}

function serializeAccessLinkContext(ctx: AccessLinkContext): SerializedAccessLinkContext {
  return {
    link: {
      id: ctx.link.id,
      token: ctx.link.token,
      organizationId: ctx.link.organizationId,
      subdivisionId: ctx.link.subdivisionId,
      revokedAt: ctx.link.revokedAt?.toISOString() ?? null,
      expiresAt: ctx.link.expiresAt?.toISOString() ?? null,
    },
    organization: ctx.organization,
    subdivision: ctx.subdivision,
  }
}

function deserializeAccessLinkContext(
  data: SerializedAccessLinkContext
): AccessLinkContext {
  return {
    link: {
      ...data.link,
      revokedAt: data.link.revokedAt ? new Date(data.link.revokedAt) : null,
      expiresAt: data.link.expiresAt ? new Date(data.link.expiresAt) : null,
    },
    organization: data.organization,
    subdivision: data.subdivision,
  }
}

function itemScopeWhere(link: {
  organizationId: number
  subdivisionId: number | null
}) {
  return {
    order: { organizationId: link.organizationId },
    ...(link.subdivisionId != null ? { subdivisionId: link.subdivisionId } : {}),
  }
}

async function loadAccessLinkFromDb(token: string): Promise<AccessLinkContext | null> {
  const link = await prismaRead.accessLink.findUnique({
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
}

async function loadAccessLinkCached(token: string): Promise<AccessLinkContext | null> {
  const serialized = await getCachedJson<SerializedAccessLinkContext | null>(
    `access-link:${token}`,
    ACCESS_LINK_CACHE_TTL_SECONDS,
    async () => {
      const ctx = await loadAccessLinkFromDb(token)
      if (!ctx) return null
      return serializeAccessLinkContext(ctx)
    }
  )

  if (!serialized) return null

  const ctx = deserializeAccessLinkContext(serialized)
  if (!isRevocableLinkActive(ctx.link)) return null
  return ctx
}

const loadAccessLink = cache(loadAccessLinkCached)

export async function validateAccessLink(token: string) {
  return loadAccessLink(token)
}

export const fetchPublicNavOrders = cache(async (token: string) => {
  const ctx = await loadAccessLink(token)
  if (!ctx) return null

  const rows = await prismaRead.orderItem.findMany({
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

  const orders = await prismaRead.order.findMany({
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

export async function getOrderForToken(token: string, orderId: number) {
  const ctx = await validateAccessLink(token)
  if (!ctx) return null

  const order = await prismaRead.order.findFirst({
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
