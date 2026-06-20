import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { parseJsonBody } from "@/lib/api/parse-body"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { delayRequestSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const rateLimited = await assertPublicRateLimit(request, token, "write")
    if (rateLimited) return rateLimited

    const orderItemId = Number(id)
    const { link, item } = await getPublicOrderItem(token, orderItemId)

    const body = await parseJsonBody(request, delayRequestSchema)
    if ("error" in body) return body.error

    if (body.data.requestedDueAt < item.dueAt) {
      return jsonError("New date must be on or after current due date")
    }

    const delay = await prisma.delayRequest.create({
      data: {
        orderItemId,
        requestedDueAt: body.data.requestedDueAt,
        justification: body.data.justification ?? null,
      },
    })

    await invalidateDashboardOnMutation(scopeFromAccessLink(link))
    return jsonOk(delay, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
