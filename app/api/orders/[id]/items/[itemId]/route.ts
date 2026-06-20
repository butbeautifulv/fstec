import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrderMutation } from "@/lib/api/revalidate-panel"
import { deleteOrderItem, updateOrderItem } from "@/lib/orders"
import { orderItemUpdateSchema } from "@/lib/validations/orders"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const body = await parseJsonBody(request, orderItemUpdateSchema)
    if ("error" in body) return body.error

    const item = await updateOrderItem(orderId, Number(itemId), body.data)
    await revalidatePanelOrderMutation(orderId)
    return jsonOk(item)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    await deleteOrderItem(orderId, Number(itemId))
    await revalidatePanelOrderMutation(orderId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
