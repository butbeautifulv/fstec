import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { parseJsonBody } from "@/lib/api/parse-body"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { submitOrderItemResponse } from "@/lib/responses/submit-response"
import { responseSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const rateLimited = await assertPublicRateLimit(request, token, "write")
    if (rateLimited) return rateLimited

    const orderItemId = Number(id)
    await getPublicOrderItem(token, orderItemId)

    const body = await parseJsonBody(request, responseSchema)
    if ("error" in body) return body.error

    const result = await submitOrderItemResponse(orderItemId, body.data)
    return jsonOk(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
