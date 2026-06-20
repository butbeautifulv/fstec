import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { validateAccessToken } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params
    const rateLimited = assertPublicRateLimit(request, token, "read")
    if (rateLimited) return rateLimited

    const ctx = await validateAccessToken(token)
    if (!ctx) throw new Error("NOT_FOUND")

    const statuses = await getWorkflowStatuses()

    return jsonOk({
      organization: ctx.organization,
      subdivision: ctx.subdivision,
      orders: ctx.orders,
      statuses,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
