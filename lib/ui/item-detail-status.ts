export function getItemDetailStatusVariant({
  isOverdue,
  isPendingReview,
  isRejected,
  completed,
}: {
  isOverdue: boolean
  isPendingReview: boolean
  isRejected?: boolean
  completed: boolean
}): "default" | "secondary" | "destructive" {
  if (isOverdue || isPendingReview || isRejected) return "destructive"
  if (completed) return "default"
  return "secondary"
}
