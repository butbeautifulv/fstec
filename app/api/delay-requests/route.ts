import { revalidatePath } from "next/cache"
import { DelayRequestStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()
    const body = await request.json()
    const id = Number(body.id)
    const action = body.action as "approve" | "reject"
    if (!id || !action) return handleApiError(new Error("id and action required"))

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

    revalidatePath("/admin")
    revalidatePath(`/admin/orders/${delay.orderItem.orderId}`)

    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
