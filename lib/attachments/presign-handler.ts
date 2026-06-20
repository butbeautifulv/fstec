import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { createPendingAttachment } from "@/lib/attachments"
import { attachmentPresignSchema } from "@/lib/validations/public"

export async function handleAttachmentPresign(
  request: Request,
  orderItemId: number
) {
  const body = await parseJsonBody(request, attachmentPresignSchema)
  if ("error" in body) return body.error

  const { attachment, uploadUrl } = await createPendingAttachment(
    orderItemId,
    body.data
  )

  return jsonOk({
    attachmentId: attachment.id,
    uploadUrl,
    storageKey: attachment.storageKey,
  })
}

export async function handleAttachmentPresignRoute(
  request: Request,
  orderItemId: number
) {
  try {
    return await handleAttachmentPresign(request, orderItemId)
  } catch (error) {
    return handleApiError(error)
  }
}
