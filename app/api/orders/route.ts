import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrder } from "@/lib/api/revalidate-panel"
import { createOrder, listOrders } from "@/lib/orders"
import { createOrderSchema } from "@/lib/validations/orders"

export async function GET() {
  try {
    await requirePermission(Permission.ordersRead)
    return jsonOk(await listOrders())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.ordersWrite)
    const body = await parseJsonBody(request, createOrderSchema)
    if ("error" in body) return body.error

    const order = await createOrder(body.data, session.userId)
    await revalidatePanelOrder()
    return jsonOk(order, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
