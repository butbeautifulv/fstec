import { handleApiError, jsonOk } from "@/lib/api/errors"
import {
  createPendingAttachment,
  assertOrderItemExists,
} from "@/lib/attachments"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { attachmentPresignSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id, itemId } = await params
    const orderId = Number(id)
    const orderItemId = Number(itemId)

    await assertOrderItemExists(orderId, orderItemId)

    const parsed = attachmentPresignSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }

    const { attachment, uploadUrl } = await createPendingAttachment(
      orderItemId,
      parsed.data
    )

    return jsonOk({
      attachmentId: attachment.id,
      uploadUrl,
      storageKey: attachment.storageKey,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
