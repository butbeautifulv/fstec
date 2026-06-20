import { z } from "zod"
import { DelayRequestStatus } from "@prisma/client"
import { invalidateKeys } from "@/lib/cache/json-cache"
import { prisma } from "@/lib/db"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { countPendingDelayRequests, listDelayRequests } from "@/lib/delays"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrderMutation } from "@/lib/api/revalidate-panel"

const delayReviewSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(["approve", "reject"]),
})

export async function GET(request: Request) {
  try {
    await requirePermission(Permission.delaysRead)
    const { searchParams } = new URL(request.url)

    if (searchParams.get("count") === "pending") {
      const count = await countPendingDelayRequests()
      return jsonOk({ count })
    }

    const statusParam = searchParams.get("status")
    const status =
      statusParam && statusParam in DelayRequestStatus
        ? (statusParam as DelayRequestStatus)
        : undefined

    const rows = await listDelayRequests(status)
    return jsonOk(rows)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.delaysWrite)
    const body = await parseJsonBody(request, delayReviewSchema)
    if ("error" in body) return body.error

    const { id, action } = body.data

    const delay = await prisma.delayRequest.findUnique({
      where: { id },
      include: { orderItem: true },
    })
    if (!delay) throw new Error("NOT_FOUND")

    if (action === "approve") {
      await prisma.$transaction([
        prisma.delayRequest.update({
          where: { id },
          data: {
            status: DelayRequestStatus.APPROVED,
            reviewedById: session.userId,
            reviewedAt: new Date(),
          },
        }),
        prisma.orderItem.update({
          where: { id: delay.orderItemId },
          data: { dueAt: delay.requestedDueAt },
        }),
      ])
    } else {
      await prisma.delayRequest.update({
        where: { id },
        data: {
          status: DelayRequestStatus.REJECTED,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      })
    }

    await revalidatePanelOrderMutation(delay.orderItem.orderId, { delays: true })
    await invalidateKeys("panel:pending:delays")

    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
