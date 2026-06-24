import type { ReviewStatus } from "@/lib/ui/review-status"

export const RESPONSE_REVIEW_STATUS_VARIANT: Record<
  ReviewStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  ACCEPTED: "secondary",
  REJECTED: "outline",
}

export const RESPONSE_REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "На проверке",
  ACCEPTED: "Принят",
  REJECTED: "Не принят",
}
