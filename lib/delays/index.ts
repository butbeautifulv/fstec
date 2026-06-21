import { DelayRequestStatus } from "@prisma/client"
import { prisma } from "@/lib/db"

export type DelayRequestRow = {
  id: number
  status: DelayRequestStatus
  requestedDueAt: Date
  justification: string | null
  createdAt: Date
  orderItem: {
    id: number
    dueAt: Date
    measure: { id: number; name: string }
    subdivision: { id: number; name: string } | null
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export async function countPendingDelayRequests() {
  return prisma.delayRequest.count({
    where: { status: DelayRequestStatus.PENDING },
  })
}

export async function listDelayRequests(status?: DelayRequestStatus) {
  return prisma.delayRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
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

export async function getDelayRequest(id: number) {
  return prisma.delayRequest.findUnique({
    where: { id },
    include: {
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

export const DELAY_STATUS_LABELS: Record<DelayRequestStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Одобрен",
  REJECTED: "Отклонён",
}
