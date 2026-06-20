import { revalidatePath } from "next/cache"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertOrderItemExists } from "@/lib/attachments"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { submitOrderItemResponse } from "@/lib/responses/submit-response"
import { responseSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const orderItemId = Number(itemId)

    await assertOrderItemExists(orderId, orderItemId)

    const parsed = responseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }

    const result = await submitOrderItemResponse(orderItemId, parsed.data)

    await invalidateDashboardOnMutation()
    revalidatePath("/panel/orders")
    revalidatePath(`/panel/orders/${orderId}`)
    revalidatePath("/panel")
    revalidatePath("/panel/responses")

    return jsonOk(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
