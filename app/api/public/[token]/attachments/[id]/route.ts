import { handleApiError } from "@/lib/api/errors"
import { createAttachmentRedirectHandler } from "@/lib/api/attachment-redirect"
import { getAttachmentForPublicToken } from "@/lib/attachments"

type Params = { params: Promise<{ token: string; id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const handleRedirect = createAttachmentRedirectHandler((attachmentId) =>
      getAttachmentForPublicToken(token, attachmentId)
    )
    return await handleRedirect(request, Number(id))
  } catch (error) {
    return handleApiError(error)
  }
}
