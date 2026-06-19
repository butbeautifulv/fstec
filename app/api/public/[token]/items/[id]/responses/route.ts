import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { getCompletedStatusId } from "@/lib/statuses"
import { isInProgress } from "@/lib/statuses/workflow"
import { checkRateLimit } from "@/lib/public/rate-limit"
import { getOrderItemForToken } from "@/lib/public/validate-token"
import { responseSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const ip = request.headers.get("x-forwarded-for") ?? "local"
    if (!checkRateLimit(`public-write:${ip}:${token}`)) {
      return jsonError("Too many requests", 429)
    }

    const orderItemId = Number(id)
    const { item } = await getOrderItemForToken(token, orderItemId)

    const parsed = responseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }

    if (!isInProgress(item.status.name) || item.status.isTerminal) {
      return jsonError("Отчёт можно отправить только для меры в работе", 400)
    }

    const completedStatusId = await getCompletedStatusId()

    const result = await prisma.$transaction(async (tx) => {
      if (parsed.data.subdivisionId) {
        await tx.orderItem.update({
          where: { id: orderItemId },
          data: { subdivisionId: parsed.data.subdivisionId },
        })
      }

      const response = await tx.response.create({
        data: {
          orderItemId,
          result: parsed.data.result,
          commentary: parsed.data.commentary ?? null,
          submittedByLabel: parsed.data.submittedByLabel ?? null,
        },
      })

      const updatedItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: { statusId: completedStatusId },
        include: { status: true, measure: true },
      })

      return { response, item: updatedItem }
    })

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
