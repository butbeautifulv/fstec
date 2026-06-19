import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { deleteOrder, getOrder, updateOrder } from "@/lib/orders"
import { updateOrderSchema } from "@/lib/validations/orders"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminSession()
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
    await requireAdminSession()
    const id = Number((await params).id)
    const parsed = updateOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const order = await updateOrder(id, parsed.data)
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${id}`)
    revalidatePath("/admin")
    return jsonOk(order)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdminSession()
    const id = Number((await params).id)
    const order = await getOrder(id)
    if (!order) throw new Error("NOT_FOUND")
    await deleteOrder(id)
    revalidatePath("/admin/orders")
    revalidatePath("/admin")
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
