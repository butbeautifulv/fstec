import { ResponseReviewStatus } from "@prisma/client"

export const RESPONSE_REVIEW_STATUS_VARIANT: Record<
  ResponseReviewStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  ACCEPTED: "secondary",
  REJECTED: "outline",
}

export const RESPONSE_REVIEW_STATUS_LABELS: Record<ResponseReviewStatus, string> = {
  PENDING: "На проверке",
  ACCEPTED: "Принят",
  REJECTED: "Не принят",
}
