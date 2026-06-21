import { sendToContacts } from "@/lib/notifications/send-to-contacts"
import { ensurePortalLink } from "@/lib/access-links"
import { getAppBaseUrl } from "@/lib/email/config"
import { orderAssignedTemplate } from "@/lib/email/templates"
import { resolveContactsForTarget } from "@/lib/contacts"
import { prisma } from "@/lib/db"

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

  await sendToContacts(
    contacts,
    () => template,
    {
      template: "order-assigned",
      relatedType: "order",
      relatedId: orderId,
      dedupeKey: (contact) => `order-assigned:${orderId}:${contact.email.toLowerCase()}`,
    }
  )
}
