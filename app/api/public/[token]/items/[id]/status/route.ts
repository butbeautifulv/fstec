import { handleApiError, jsonError } from "@/lib/api/errors"
import { guardPublicOrderItemWrite } from "@/lib/public/guard-order-item-write"

type Params = { params: Promise<{ token: string; id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token, id } = await params
    const guarded = await guardPublicOrderItemWrite(request, token, id)
    if ("error" in guarded) return guarded.error

    return jsonError("Изменение статуса через API больше не поддерживается", 400)
  } catch (error) {
    return handleApiError(error)
  }
}
