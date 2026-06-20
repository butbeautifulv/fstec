import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { parseJsonBody } from "@/lib/api/parse-body"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { getInProgressStatusId } from "@/lib/statuses"
import { isNotStarted } from "@/lib/statuses/workflow"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { statusActionSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const rateLimited = assertPublicRateLimit(request, token, "write")
    if (rateLimited) return rateLimited

    const orderItemId = Number(id)
    const { link, item } = await getPublicOrderItem(token, orderItemId)

    const body = await parseJsonBody(request, statusActionSchema)
    if ("error" in body) return body.error

    if (body.data.action === "start") {
      if (!isNotStarted(item.status.name)) {
        return jsonError("Мера уже в работе или завершена", 400)
      }

      const inProgressStatusId = await getInProgressStatusId()
      const updated = await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { statusId: inProgressStatusId },
        include: { status: true, measure: true },
      })

      await invalidateDashboardOnMutation(scopeFromAccessLink(link))
      return jsonOk(updated)
    }

    return jsonError("Unsupported action", 400)
  } catch (error) {
    return handleApiError(error)
  }
}
