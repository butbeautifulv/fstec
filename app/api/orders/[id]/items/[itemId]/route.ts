import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { deleteOrderItem, updateOrderItem } from "@/lib/orders"
import { orderItemUpdateSchema } from "@/lib/validations/orders"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdminSession()
    const { id, itemId } = await params
    const orderId = Number(id)
    const parsed = orderItemUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const item = await updateOrderItem(orderId, Number(itemId), parsed.data)
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath("/admin")
    return jsonOk(item)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdminSession()
    const { id, itemId } = await params
    const orderId = Number(id)
    await deleteOrderItem(orderId, Number(itemId))
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath("/admin")
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
