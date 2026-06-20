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
    isInProgress(item.status.name) && !completed && !isPendingReview
  const displayStatus = isPendingReview ? "На проверке" : getDisplayStatusName(item)
  const statusVariant = getItemDetailStatusVariant({
    isOverdue,
    isPendingReview,
    completed,
  })

  return {
    isOverdue,
    completed,
    isPendingReview,
    isRejected,
    canStart,
    canSubmitReport,
    displayStatus,
    statusVariant,
  }
}
