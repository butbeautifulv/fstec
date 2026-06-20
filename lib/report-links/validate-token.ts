import { cache } from "react"
import { prisma } from "@/lib/db"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import { fetchOrderItemDetailById } from "@/lib/order-items/fetch-detail"

const loadReportLink = cache(async (token: string) => {
  const link = await prisma.reportLink.findUnique({ where: { token } })
  if (!link || !isRevocableLinkActive(link)) return null
  return { link }
})

export async function validateReportToken(token: string) {
  return loadReportLink(token)
}

export async function getOrderItemForReportToken(token: string, orderItemId: number) {
  const ctx = await validateReportToken(token)
  if (!ctx) throw new Error("NOT_FOUND")

  const item = await fetchOrderItemDetailById(orderItemId)

  if (!item) throw new Error("NOT_FOUND")

  return { link: ctx.link, item }
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

  if (!order || order.items.length === 0) return null

  return { link: ctx.link, order }
}

export async function getOrganizationOrdersForReportToken(
  token: string,
  organizationId: number
) {
  const ctx = await validateReportToken(token)
  if (!ctx) return null

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

  return { link: ctx.link, organization, orders }
}
