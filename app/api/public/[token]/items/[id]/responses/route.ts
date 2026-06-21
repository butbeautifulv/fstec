import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { queueNotification } from "@/lib/notifications/queue"
import { guardPublicOrderItemWrite } from "@/lib/public/guard-order-item-write"
import { submitOrderItemResponse } from "@/lib/responses/submit-response"
import { responseSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const guarded = await guardPublicOrderItemWrite(request, token, id)
    if ("error" in guarded) return guarded.error

    const body = await parseJsonBody(request, responseSchema)
    if ("error" in body) return body.error

    const result = await submitOrderItemResponse(guarded.orderItemId, body.data)
    queueNotification(async () => {
      const { notifyResponseSubmitted } = await import("@/lib/notifications/response-submitted")
      await notifyResponseSubmitted(result.response.id)
    })
    return jsonOk(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
