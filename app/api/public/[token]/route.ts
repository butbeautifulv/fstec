import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { checkRateLimit } from "@/lib/public/rate-limit"
import { validateAccessToken } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params
    const ip = request.headers.get("x-forwarded-for") ?? "local"
    if (!checkRateLimit(`public:${ip}:${token}`)) {
      return jsonError("Too many requests", 429)
    }

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
