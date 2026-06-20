import { ResponseReviewStatus } from "@prisma/client"
import { RESPONSE_REVIEW_STATUS_LABELS } from "@/lib/responses"

export const RESPONSE_REVIEW_STATUS_VARIANT: Record<
  ResponseReviewStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  ACCEPTED: "secondary",
  REJECTED: "outline",
}

export { RESPONSE_REVIEW_STATUS_LABELS }
