import { handleApiError } from "@/lib/api/errors"
import { createAttachmentRedirectHandler } from "@/lib/api/attachment-redirect"
import { getAttachmentForReportToken } from "@/lib/attachments"

type Params = { params: Promise<{ token: string; id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const handleRedirect = createAttachmentRedirectHandler((attachmentId) =>
      getAttachmentForReportToken(token, attachmentId)
    )
    return await handleRedirect(request, Number(id))
  } catch (error) {
    return handleApiError(error)
  }
}
