import { ensurePortalLink } from "@/lib/access-links"
import { resolveContactsForTarget } from "@/lib/contacts"
import { getAppBaseUrl } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { dueReminderTemplate } from "@/lib/email/templates"
import { prisma } from "@/lib/db"
import { isOrderItemOverdue } from "@/lib/statuses/workflow"

const DUE_SOON_MS = 3 * 24 * 60 * 60 * 1000

export async function sendDueReminders() {
  const now = new Date()
  const dueSoonUntil = new Date(now.getTime() + DUE_SOON_MS)

  const items = await prisma.orderItem.findMany({
    where: {
      status: { isTerminal: false },
      dueAt: { lte: dueSoonUntil },
    },
    include: {
      measure: { select: { name: true } },
      status: true,
      order: {
        select: {
          title: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
    },
  })

  let sent = 0

  for (const item of items) {
    const overdue = isOrderItemOverdue(item, now)
    const dueSoon = !overdue && item.dueAt >= now
    if (!overdue && !dueSoon) continue

    const contacts = await resolveContactsForTarget({
      organizationId: item.order.organizationId,
      subdivisionId: item.subdivisionId,
    })
    if (contacts.length === 0) continue

    const link = await ensurePortalLink({
      organizationId: item.order.organizationId,
      subdivisionId: item.subdivisionId,
    })

    const portalUrl = `${getAppBaseUrl()}/p/${link.token}`
    const template = dueReminderTemplate({
      organizationName: item.order.organization.name,
      measureName: item.measure.name,
      orderTitle: item.order.title,
      dueAt: item.dueAt,
      overdue,
      portalUrl,
    })

    const kind = overdue ? "overdue" : "due-soon"
    const dayKey = now.toISOString().slice(0, 10)

    for (const contact of contacts) {
      const dedupeKey = `due-reminder:${kind}:${item.id}:${contact.email.toLowerCase()}:${dayKey}`
      const existing = await prisma.emailDelivery.findUnique({ where: { dedupeKey } })
      if (existing?.status === "SENT") continue

      await sendEmail({
        to: contact.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        template: "due-reminder",
        relatedType: "order_item",
        relatedId: item.id,
        dedupeKey,
      })
      sent += 1
    }
  }

  return { sent }
}
