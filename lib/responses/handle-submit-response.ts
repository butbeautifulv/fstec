import { handleApiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { submitOrderItemResponse } from "@/lib/responses/submit-response"
import { responseSchema } from "@/lib/validations/public"

export async function handleSubmitOrderItemResponse(
  request: Request,
  orderItemId: number
) {
  const body = await parseJsonBody(request, responseSchema)
  if ("error" in body) return { error: body.error }

  const result = await submitOrderItemResponse(orderItemId, body.data)
  return { data: result }
}

export async function handleSubmitOrderItemResponseRoute(
  request: Request,
  orderItemId: number
) {
  try {
    const result = await handleSubmitOrderItemResponse(request, orderItemId)
    if ("error" in result) return result.error
    return result.data
  } catch (error) {
    return handleApiError(error)
  }
}
