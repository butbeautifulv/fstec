import { sendToContacts } from "@/lib/notifications/send-to-contacts"
import { ensurePortalLink } from "@/lib/access-links"
import { resolveContactsForTarget } from "@/lib/contacts"
import { getAppBaseUrl } from "@/lib/email/config"
import { responseReviewedTemplate } from "@/lib/email/templates"
import { prisma } from "@/lib/db"

export async function notifyResponseReviewed(responseId: number) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      orderItem: {
        include: {
          measure: { select: { name: true } },
          order: {
            select: {
              organizationId: true,
              title: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  if (!response) return

  const subdivisionId = response.orderItem.subdivisionId
  const contacts = await resolveContactsForTarget({
    organizationId: response.orderItem.order.organizationId,
    subdivisionId,
  })

  if (contacts.length === 0) return

  const link = await ensurePortalLink({
    organizationId: response.orderItem.order.organizationId,
    subdivisionId,
  })

  const portalUrl = `${getAppBaseUrl()}/p/${link.token}`
  const accepted = response.reviewStatus === "ACCEPTED"
  const template = responseReviewedTemplate({
    organizationName: response.orderItem.order.organization.name,
    measureName: response.orderItem.measure.name,
    orderTitle: response.orderItem.order.title,
    accepted,
    reviewNote: response.reviewNote,
    portalUrl,
  })

  await sendToContacts(
    contacts,
    () => template,
    {
      template: "response-reviewed",
      relatedType: "response",
      relatedId: responseId,
      dedupeKey: (contact) =>
        `response-reviewed:${responseId}:${accepted ? "accepted" : "rejected"}:${contact.email.toLowerCase()}`,
    }
  )
}
