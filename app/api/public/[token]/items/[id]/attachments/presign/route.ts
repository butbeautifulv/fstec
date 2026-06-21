import { handleApiError } from "@/lib/api/errors"
import { handleAttachmentPresign } from "@/lib/attachments/presign-handler"
import { guardPublicOrderItemWrite } from "@/lib/public/guard-order-item-write"

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const guarded = await guardPublicOrderItemWrite(request, token, id)
    if ("error" in guarded) return guarded.error

    return handleAttachmentPresign(request, guarded.orderItemId)
  } catch (error) {
    return handleApiError(error)
  }
}
