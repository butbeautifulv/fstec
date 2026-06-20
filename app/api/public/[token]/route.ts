import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertPublicRateLimit } from "@/lib/api/public-guard"
import {
  fetchPublicOrderSummaries,
} from "@/lib/public/validate-token"
import {
  serializePublicOrderSummary,
  serializePublicStatuses,
} from "@/lib/public/serialize-public"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params
    const rateLimited = await assertPublicRateLimit(request, token, "read")
    if (rateLimited) return rateLimited

    const ctx = await fetchPublicOrderSummaries(token)
    if (!ctx) throw new Error("NOT_FOUND")

    const statuses = await getWorkflowStatuses()

    return jsonOk({
      organization: ctx.organization,
      subdivision: ctx.subdivision,
      orders: ctx.orders.map(serializePublicOrderSummary),
      statuses: serializePublicStatuses(statuses),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
