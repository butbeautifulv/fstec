import { revalidatePath } from "next/cache"
import { ResponseReviewStatus } from "@prisma/client"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"
import { countPendingResponses, listResponses } from "@/lib/responses"
import { reviewResponse } from "@/lib/responses/review-response"
import { z } from "zod"

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
        message: "reviewNote required",
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
    const body = await request.json()
    const parsed = reviewSchema.safeParse({
      id: Number(body.id),
      action: body.action,
      reviewNote: body.reviewNote,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      if (issue?.path[0] === "reviewNote") {
        return handleApiError(new Error("REVIEW_NOTE_REQUIRED"))
      }
      return handleApiError(new Error(issue?.message ?? "Invalid request"))
    }

    const { id, action, reviewNote } = parsed.data
    const response = await reviewResponse(id, action, session.userId, reviewNote)

    const orderId = response.orderItem.order.id
    await invalidateDashboardOnMutation()
    revalidatePath("/panel")
    revalidatePath("/panel/responses")
    revalidatePath(`/panel/responses/${id}`)
    revalidatePath(`/panel/orders/${orderId}`)

    return jsonOk({ ok: true, response })
  } catch (error) {
    return handleApiError(error)
  }
}
