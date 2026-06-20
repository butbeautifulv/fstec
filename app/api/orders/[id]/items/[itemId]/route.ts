import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { deleteOrderItem, updateOrderItem } from "@/lib/orders"
import { orderItemUpdateSchema } from "@/lib/validations/orders"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const parsed = orderItemUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const item = await updateOrderItem(orderId, Number(itemId), parsed.data)
    await invalidateDashboardOnMutation()
    revalidatePath("/panel/orders")
    revalidatePath(`/panel/orders/${orderId}`)
    revalidatePath("/panel")
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
    await invalidateDashboardOnMutation()
    revalidatePath("/panel/orders")
    revalidatePath(`/panel/orders/${orderId}`)
    revalidatePath("/panel")
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
