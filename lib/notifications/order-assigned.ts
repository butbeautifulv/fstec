import {
  createOrganizationAccessLink,
  createSubdivisionAccessLink,
  getActiveOrgLink,
  getActiveSubdivisionLink,
} from "@/lib/access-links"
import { getAppBaseUrl } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { orderAssignedTemplate } from "@/lib/email/templates"
import { resolveContactsForTarget } from "@/lib/contacts"
import { prisma } from "@/lib/db"

async function ensurePortalLink(input: {
  organizationId: number
  subdivisionId: number | null
}) {
  if (input.subdivisionId != null) {
    const existing = await getActiveSubdivisionLink(input.subdivisionId)
    if (existing) return existing
    return createSubdivisionAccessLink(input.subdivisionId)
  }

  const existing = await getActiveOrgLink(input.organizationId)
  if (existing) return existing
  return createOrganizationAccessLink(input.organizationId)
}

export async function notifyOrderAssigned(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      organization: { select: { id: true, name: true } },
      items: {
        take: 1,
        select: { subdivisionId: true },
      },
      _count: { select: { items: true } },
    },
  })
  if (!order) return

  const subdivisionId = order.items[0]?.subdivisionId ?? null
  const link = await ensurePortalLink({
    organizationId: order.organizationId,
    subdivisionId,
  })

  const contacts = await resolveContactsForTarget({
    organizationId: order.organizationId,
    subdivisionId,
  })

  if (contacts.length === 0) {
    console.info("[notifyOrderAssigned] no contacts", { orderId })
    return
  }

  const portalUrl = `${getAppBaseUrl()}/p/${link.token}`
  const template = orderAssignedTemplate({
    organizationName: order.organization.name,
    orderTitle: order.title,
    dueAt: order.defaultDueAt,
    measureCount: order._count.items,
    portalUrl,
  })

  await Promise.all(
    contacts.map((contact) =>
      sendEmail({
        to: contact.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        template: "order-assigned",
        relatedType: "order",
        relatedId: orderId,
        dedupeKey: `order-assigned:${orderId}:${contact.email.toLowerCase()}`,
      })
    )
  )
}
