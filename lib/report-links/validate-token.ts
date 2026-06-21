import { cache } from "react"
import { prisma } from "@/lib/db"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import { fetchOrderItemDetailById } from "@/lib/order-items/fetch-detail"
import {
  isOrderItemInReportScope,
  isOrganizationInReportScope,
  isReportScopeAllowed,
  scopeFromReportLink,
} from "@/lib/report-links/scope"
import type { DashboardScope } from "@/lib/dashboard/stats"

const loadReportLink = cache(async (token: string) => {
  const link = await prisma.reportLink.findUnique({ where: { token } })
  if (!link || !isRevocableLinkActive(link)) return null
  const scope = scopeFromReportLink(link)
  return { link, scope }
})

export async function validateReportToken(token: string) {
  return loadReportLink(token)
}

export function assertReportScopeAllowed(
  ctx: { scope: DashboardScope },
  requestedScope: DashboardScope
): boolean {
  return isReportScopeAllowed(ctx.scope, requestedScope)
}

export async function getOrderItemForReportToken(token: string, orderItemId: number) {
  const ctx = await validateReportToken(token)
  if (!ctx) throw new Error("NOT_FOUND")

  const item = await fetchOrderItemDetailById(orderItemId)

  if (!item || !isOrderItemInReportScope(ctx.scope, item)) {
    throw new Error("NOT_FOUND")
  }

  return { link: ctx.link, scope: ctx.scope, item }
}

export async function getOrderForReportToken(token: string, orderId: number) {
  const ctx = await validateReportToken(token)
  if (!ctx) return null

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      organization: true,
      items: {
        include: {
          measure: true,
          status: true,
          subdivision: true,
        },
        orderBy: [{ measure: { name: "asc" } }],
      },
    },
  })

  if (
    !order ||
    order.items.length === 0 ||
    !isOrganizationInReportScope(ctx.scope, order.organizationId)
  ) {
    return null
  }

  if (ctx.scope.type === "subdivision") {
    const { subdivisionId } = ctx.scope
    const scopedItems = order.items.filter(
      (item) => item.subdivisionId === subdivisionId
    )
    if (scopedItems.length === 0) return null
    return { link: ctx.link, scope: ctx.scope, order: { ...order, items: scopedItems } }
  }

  return { link: ctx.link, scope: ctx.scope, order }
}

export async function getOrganizationOrdersForReportToken(
  token: string,
  organizationId: number
) {
  const ctx = await validateReportToken(token)
  if (!ctx || !isOrganizationInReportScope(ctx.scope, organizationId)) return null

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  })
  if (!organization) return null

  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      items: { some: {} },
    },
    include: { _count: { select: { items: true } } },
    orderBy: { issuedAt: "desc" },
  })

  return { link: ctx.link, scope: ctx.scope, organization, orders }
}
