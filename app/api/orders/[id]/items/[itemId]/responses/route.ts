import { handleApiError, jsonOk } from "@/lib/api/errors"
import { invalidateKeys } from "@/lib/cache/json-cache"
import { revalidatePanelOrderMutation } from "@/lib/api/revalidate-panel"
import { assertOrderItemExists } from "@/lib/attachments"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { queueNotification } from "@/lib/notifications/queue"
import { handleSubmitOrderItemResponse } from "@/lib/responses/handle-submit-response"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const orderItemId = Number(itemId)

    await assertOrderItemExists(orderId, orderItemId)

    const result = await handleSubmitOrderItemResponse(request, orderItemId)
    if ("error" in result) return result.error

    await revalidatePanelOrderMutation(orderId, { responses: true })
    await invalidateKeys("panel:pending:responses")

    queueNotification(async () => {
      const { notifyResponseSubmitted } = await import("@/lib/notifications/response-submitted")
      await notifyResponseSubmitted(result.data.response.id)
    })

    return jsonOk(result.data, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
