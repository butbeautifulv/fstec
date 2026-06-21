import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrder } from "@/lib/api/revalidate-panel"
import { batchCreateOrders, BatchCreateValidationError } from "@/lib/orders/batch-create"
import { notifyOrderAssigned } from "@/lib/notifications/order-assigned"
import { batchCreateOrdersSchema } from "@/lib/validations/orders"

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.ordersWrite)
    const body = await parseJsonBody(request, batchCreateOrdersSchema)
    if ("error" in body) return body.error

    const orders = await batchCreateOrders(body.data, session.userId)
    await revalidatePanelOrder()

    void Promise.all(orders.map((order) => notifyOrderAssigned(order.id))).catch((error) => {
      console.error("Batch order notification failed:", error)
    })

    return jsonOk({ orders, count: orders.length }, { status: 201 })
  } catch (error) {
    if (error instanceof BatchCreateValidationError) {
      return handleApiError(new Error(error.message))
    }
    return handleApiError(error)
  }
}
