import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { getPublicOrderItem } from "@/lib/public/validate-token"

export async function guardPublicOrderItemWrite(
  request: Request,
  token: string,
  idRaw: string
) {
  const rateLimited = await assertPublicRateLimit(request, token, "write")
  if (rateLimited) return { error: rateLimited as Response }

  const orderItemId = Number(idRaw)
  const { link, item } = await getPublicOrderItem(token, orderItemId)
  return { link, item, orderItemId }
}
