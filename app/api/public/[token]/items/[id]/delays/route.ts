import { prisma } from "@/lib/db"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { checkRateLimit } from "@/lib/public/rate-limit"
import { getOrderItemForToken } from "@/lib/public/validate-token"
import { delayRequestSchema } from "@/lib/validations/public"

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

    const parsed = delayRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }

    if (parsed.data.requestedDueAt < item.dueAt) {
      return jsonError("New date must be on or after current due date")
    }

    const delay = await prisma.delayRequest.create({
      data: {
        orderItemId,
        requestedDueAt: parsed.data.requestedDueAt,
        justification: parsed.data.justification ?? null,
      },
    })

    return jsonOk(delay, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
