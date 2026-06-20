import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
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
    const parsed = createOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const order = await createOrder(parsed.data, session.userId)
    revalidatePath("/admin/orders")
    revalidatePath("/admin")
    return jsonOk(order, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
