import { ResponseReviewStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { linkAttachmentsToResponse } from "@/lib/attachments"
import { isInProgress } from "@/lib/statuses/workflow"
import type { ResponseInput } from "@/lib/validations/public"

export async function submitOrderItemResponse(
  orderItemId: number,
  data: ResponseInput
) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { status: true },
  })
  if (!item) throw new Error("NOT_FOUND")

  if (!isInProgress(item.status.name) || item.status.isTerminal) {
    throw new Error("INVALID_STATUS")
  }

  const pending = await prisma.response.findFirst({
    where: { orderItemId, reviewStatus: ResponseReviewStatus.PENDING },
  })
  if (pending) throw new Error("PENDING_EXISTS")

  const attachmentIds = data.attachmentIds ?? []

  return prisma.$transaction(async (tx) => {
    if (data.subdivisionId) {
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { subdivisionId: data.subdivisionId },
      })
    }

    const response = await tx.response.create({
      data: {
        orderItemId,
        result: data.result,
        commentary: data.commentary ?? null,
        submittedByLabel: data.submittedByLabel ?? null,
        reviewStatus: ResponseReviewStatus.PENDING,
      },
      include: { attachments: true },
    })

    if (attachmentIds.length > 0) {
      await linkAttachmentsToResponse(response.id, orderItemId, attachmentIds, tx)
    }

    const updatedItem = await tx.orderItem.findUniqueOrThrow({
      where: { id: orderItemId },
      include: { status: true, measure: true },
    })

    const responseWithAttachments = await tx.response.findUniqueOrThrow({
      where: { id: response.id },
      include: { attachments: true },
    })

    return { response: responseWithAttachments, item: updatedItem }
  })
}
