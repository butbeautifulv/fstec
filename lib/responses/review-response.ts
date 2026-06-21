import { ResponseReviewStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getCompletedStatusId, getInProgressStatusId } from "@/lib/statuses"

const RESPONSE_REVIEW_INCLUDE = {
  attachments: true,
  reviewedBy: { select: { id: true, name: true } },
  orderItem: {
    include: {
      status: true,
      measure: true,
      subdivision: { select: { id: true, name: true } },
      order: {
        select: {
          id: true,
          title: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const

export async function reviewResponse(
  responseId: number,
  action: "accept" | "reject",
  reviewerId: number,
  reviewNote?: string | null
) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { orderItem: { include: { status: true } } },
  })
  if (!response) throw new Error("NOT_FOUND")

  if (response.reviewStatus !== ResponseReviewStatus.PENDING) {
    throw new Error("INVALID_STATUS")
  }

  if (action === "reject" && !reviewNote?.trim()) {
    throw new Error("REVIEW_NOTE_REQUIRED")
  }

  const now = new Date()

  if (action === "accept") {
    const completedStatusId = await getCompletedStatusId()
    return prisma.$transaction(async (tx) => {
      const updated = await tx.response.update({
        where: { id: responseId },
        data: {
          reviewStatus: ResponseReviewStatus.ACCEPTED,
          reviewedById: reviewerId,
          reviewedAt: now,
          reviewNote: null,
        },
        include: RESPONSE_REVIEW_INCLUDE,
      })

      await tx.orderItem.update({
        where: { id: response.orderItemId },
        data: { statusId: completedStatusId },
      })

      return updated
    })
  }

  const inProgressStatusId = await getInProgressStatusId()
  return prisma.$transaction(async (tx) => {
    const updated = await tx.response.update({
      where: { id: responseId },
      data: {
        reviewStatus: ResponseReviewStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: now,
        reviewNote: reviewNote!.trim(),
      },
      include: RESPONSE_REVIEW_INCLUDE,
    })

    await tx.orderItem.update({
      where: { id: response.orderItemId },
      data: { statusId: inProgressStatusId },
    })

    return updated
  })
}
