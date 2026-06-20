import { handleApiError } from "@/lib/api/errors"
import { createAttachmentRedirectHandler } from "@/lib/api/attachment-redirect"
import { getAttachmentForPanel } from "@/lib/attachments"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"

type Params = { params: Promise<{ id: string }> }

const handleRedirect = createAttachmentRedirectHandler(getAttachmentForPanel)

export async function GET(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.ordersRead)
    const attachmentId = Number((await params).id)
    return await handleRedirect(request, attachmentId)
  } catch (error) {
    return handleApiError(error)
  }
}
