import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { guardPublicOrderItemWrite } from "@/lib/public/guard-order-item-write"
import { delayRequestSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const guarded = await guardPublicOrderItemWrite(request, token, id)
    if ("error" in guarded) return guarded.error

    const body = await parseJsonBody(request, delayRequestSchema)
    if ("error" in body) return body.error

    if (body.data.requestedDueAt < guarded.item.dueAt) {
      return jsonError("New date must be on or after current due date")
    }

    const delay = await prisma.delayRequest.create({
      data: {
        orderItemId: guarded.orderItemId,
        requestedDueAt: body.data.requestedDueAt,
        justification: body.data.justification ?? null,
      },
    })

    await invalidateDashboardOnMutation(scopeFromAccessLink(guarded.link))
    return jsonOk(delay, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
