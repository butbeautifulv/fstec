import { ResponseReviewStatus } from "@prisma/client"
import { z } from "zod"
import { invalidateKeys } from "@/lib/cache/json-cache"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrderMutation } from "@/lib/api/revalidate-panel"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { countPendingResponses, listResponses } from "@/lib/responses"
import { reviewResponse } from "@/lib/responses/review-response"

const reviewSchema = z
  .object({
    id: z.number().int().positive(),
    action: z.enum(["accept", "reject"]),
    reviewNote: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "reject" && !data.reviewNote?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "REVIEW_NOTE_REQUIRED",
        path: ["reviewNote"],
      })
    }
  })

export async function GET(request: Request) {
  try {
    await requirePermission(Permission.ordersRead)
    const { searchParams } = new URL(request.url)

    if (searchParams.get("count") === "pending") {
      const count = await countPendingResponses()
      return jsonOk({ count })
    }

    const statusParam = searchParams.get("status")
    const status =
      statusParam && statusParam in ResponseReviewStatus
        ? (statusParam as ResponseReviewStatus)
        : undefined

    const rows = await listResponses(status)
    return jsonOk(rows)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.ordersWrite)
    const body = await parseJsonBody(request, reviewSchema)
    if ("error" in body) return body.error

    const { id, action, reviewNote } = body.data
    const response = await reviewResponse(id, action, session.userId, reviewNote)

    const orderId = response.orderItem.order.id
    await revalidatePanelOrderMutation(orderId, {
      responses: true,
      responseId: id,
    })
    await invalidateKeys("panel:pending:responses")

    return jsonOk({ ok: true, response })
  } catch (error) {
    return handleApiError(error)
  }
}
