import { DelayRequestStatus } from "@prisma/client"

export const DELAY_STATUS_VARIANT: Record<
  DelayRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "destructive",
  APPROVED: "secondary",
  REJECTED: "outline",
}

export { DELAY_STATUS_LABELS } from "@/lib/delays"
