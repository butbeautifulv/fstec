import { ResponseReviewStatus } from "@prisma/client"
import { prisma } from "@/lib/db"

export const RESPONSE_REVIEW_STATUS_LABELS: Record<ResponseReviewStatus, string> = {
  PENDING: "На проверке",
  ACCEPTED: "Принят",
  REJECTED: "Не принят",
}

export async function getResponse(id: number) {
  return prisma.response.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      reviewedBy: { select: { id: true, name: true } },
      orderItem: {
        include: {
          measure: { select: { id: true, name: true } },
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
    },
  })
}

export async function countPendingResponses() {
  return prisma.response.count({
    where: { reviewStatus: ResponseReviewStatus.PENDING },
  })
}

export async function listResponses(status?: ResponseReviewStatus) {
  return prisma.response.findMany({
    where: status ? { reviewStatus: status } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      orderItem: {
        include: {
          measure: { select: { id: true, name: true } },
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
    },
  })
}
