import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { getInProgressStatusId } from "@/lib/statuses"
import { isNotStarted } from "@/lib/statuses/workflow"
import { checkRateLimit } from "@/lib/public/rate-limit"
import { getOrderItemForToken } from "@/lib/public/validate-token"
import { statusActionSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const ip = request.headers.get("x-forwarded-for") ?? "local"
    if (!checkRateLimit(`public-write:${ip}:${token}`)) {
      return jsonError("Too many requests", 429)
    }

    const orderItemId = Number(id)
    const { item } = await getOrderItemForToken(token, orderItemId)

    const parsed = statusActionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }

    if (parsed.data.action === "start") {
      if (!isNotStarted(item.status.name)) {
        return jsonError("Мера уже в работе или завершена", 400)
      }

      const inProgressStatusId = await getInProgressStatusId()
      const updated = await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { statusId: inProgressStatusId },
        include: { status: true, measure: true },
      })

      return jsonOk(updated)
    }

    return jsonError("Unsupported action", 400)
  } catch (error) {
    return handleApiError(error)
  }
}
