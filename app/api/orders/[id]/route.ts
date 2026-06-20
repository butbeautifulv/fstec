import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrder } from "@/lib/api/revalidate-panel"
import { deleteOrder, getOrder, updateOrder } from "@/lib/orders"
import { updateOrderSchema } from "@/lib/validations/orders"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersRead)
    const id = Number((await params).id)
    const order = await getOrder(id)
    if (!order) throw new Error("NOT_FOUND")
    return jsonOk(order)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const id = Number((await params).id)
    const body = await parseJsonBody(request, updateOrderSchema)
    if ("error" in body) return body.error

    const order = await updateOrder(id, body.data)
    await revalidatePanelOrder(id)
    return jsonOk(order)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const id = Number((await params).id)
    const order = await getOrder(id)
    if (!order) throw new Error("NOT_FOUND")
    await deleteOrder(id)
    await revalidatePanelOrder()
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
