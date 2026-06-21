import { getAppBaseUrl, getOperatorNotifyEmail } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { responseSubmittedTemplate } from "@/lib/email/templates"
import { prisma } from "@/lib/db"

export async function notifyResponseSubmitted(responseId: number) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      orderItem: {
        include: {
          measure: { select: { name: true } },
          order: {
            select: {
              title: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  if (!response) return

  const reviewUrl = `${getAppBaseUrl()}/panel/responses/${responseId}`
  const template = responseSubmittedTemplate({
    organizationName: response.orderItem.order.organization.name,
    measureName: response.orderItem.measure.name,
    orderTitle: response.orderItem.order.title,
    reviewUrl,
  })

  await sendEmail({
    to: getOperatorNotifyEmail(),
    subject: template.subject,
    text: template.text,
    html: template.html,
    template: "response-submitted",
    relatedType: "response",
    relatedId: responseId,
    dedupeKey: `response-submitted:${responseId}`,
  })
}
