import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { parseJsonBody } from "@/lib/api/parse-body"
import { createPendingAttachment } from "@/lib/attachments"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { attachmentPresignSchema } from "@/lib/validations/public"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const rateLimited = assertPublicRateLimit(request, token, "write")
    if (rateLimited) return rateLimited

    const orderItemId = Number(id)
    await getPublicOrderItem(token, orderItemId)

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
  } catch (error) {
    return handleApiError(error)
  }
}
