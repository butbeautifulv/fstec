import {
  createOrganizationAccessLink,
  createSubdivisionAccessLink,
  getActiveOrgLink,
  getActiveSubdivisionLink,
} from "@/lib/access-links"
import { resolveContactsForTarget } from "@/lib/contacts"
import { getAppBaseUrl } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { responseReviewedTemplate } from "@/lib/email/templates"
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

  await Promise.all(
    contacts.map((contact) =>
      sendEmail({
        to: contact.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        template: "response-reviewed",
        relatedType: "response",
        relatedId: responseId,
        dedupeKey: `response-reviewed:${responseId}:${accepted ? "accepted" : "rejected"}:${contact.email.toLowerCase()}`,
      })
    )
  )
}
