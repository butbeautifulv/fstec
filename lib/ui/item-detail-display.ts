import { ResponseReviewStatus } from "@prisma/client"
import {
  getDisplayStatusName,
  isCompleted,
  isInProgress,
  isNotStarted,
  isOrderItemOverdue,
} from "@/lib/statuses/workflow"
import { getItemDetailStatusVariant } from "@/lib/ui/item-detail-status"

type ItemStatusLike = {
  status: { name: string; isTerminal?: boolean }
  dueAt: string
}

type LatestResponseLike = {
  reviewStatus: ResponseReviewStatus
} | null | undefined

export function getItemDetailDisplayState(
  item: ItemStatusLike,
  latestResponse?: LatestResponseLike
) {
  const isOverdue = isOrderItemOverdue(item)
  const completed = isCompleted({
    isTerminal: item.status.isTerminal ?? false,
    name: item.status.name,
  })
  const isPendingReview =
    latestResponse?.reviewStatus === ResponseReviewStatus.PENDING
  const isRejected =
    latestResponse?.reviewStatus === ResponseReviewStatus.REJECTED
  const canStart = isNotStarted(item.status.name)
  const canSubmitReport =
    isInProgress(item.status.name) &&
    !completed &&
    !isPendingReview &&
    (!latestResponse || isRejected)
  const reportStatusLabel = isPendingReview
    ? "На проверке"
    : isRejected
      ? "Требует доработки"
      : null
  const workflowStatusName = getDisplayStatusName(item)
  const displayStatus = reportStatusLabel ?? workflowStatusName
  const workflowStatusVariant = getItemDetailStatusVariant({
    isOverdue,
    isPendingReview: false,
    isRejected: false,
    completed,
  })

  return {
    isOverdue,
    completed,
    isPendingReview,
    isRejected,
    canStart,
    canSubmitReport,
    workflowStatusName,
    reportStatusLabel,
    displayStatus,
    statusVariant: workflowStatusVariant,
  }
}

export type ItemWorkflowPhase =
  | "not_started"
  | "in_progress_form"
  | "pending_review"
  | "rejected"
  | "completed"

export function getItemWorkflowPhase(
  state: Pick<
    ReturnType<typeof getItemDetailDisplayState>,
    "completed" | "isPendingReview" | "isRejected" | "canSubmitReport"
  >
): ItemWorkflowPhase {
  if (state.completed) return "completed"
  if (state.isPendingReview) return "pending_review"
  if (state.isRejected) return "rejected"
  if (state.canSubmitReport) return "in_progress_form"
  return "not_started"
}
