import { DelayRequestStatus } from "@prisma/client"

export const DELAY_STATUS_VARIANT: Record<
  DelayRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  APPROVED: "secondary",
  REJECTED: "outline",
}

export const DELAY_STATUS_LABELS: Record<DelayRequestStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Одобрен",
  REJECTED: "Отклонён",
}
