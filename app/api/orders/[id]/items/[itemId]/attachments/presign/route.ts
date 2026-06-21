import { handleApiError } from "@/lib/api/errors"
import {
  assertOrderItemExists,
} from "@/lib/attachments"
import { handleAttachmentPresign } from "@/lib/attachments/presign-handler"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const orderItemId = Number(itemId)

    await assertOrderItemExists(orderId, orderItemId)

    return handleAttachmentPresign(request, orderItemId)
  } catch (error) {
    return handleApiError(error)
  }
}
