import { handleApiError } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { handleAttachmentPresignRoute } from "@/lib/attachments/presign-handler"
import { getPublicOrderItem } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const rateLimited = assertPublicRateLimit(request, token, "write")
    if (rateLimited) return rateLimited

    const orderItemId = Number(id)
    await getPublicOrderItem(token, orderItemId)

    return handleAttachmentPresignRoute(request, orderItemId)
  } catch (error) {
    return handleApiError(error)
  }
}
