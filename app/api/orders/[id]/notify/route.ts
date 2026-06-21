import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { notifyOrderAssigned } from "@/lib/notifications/order-assigned"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id } = await context.params
    const orderId = Number(id)
    if (Number.isNaN(orderId)) return handleApiError(new Error("NOT_FOUND"))

    await notifyOrderAssigned(orderId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
