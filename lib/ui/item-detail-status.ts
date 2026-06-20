export function getItemDetailStatusVariant({
  isOverdue,
  isPendingReview,
  completed,
}: {
  isOverdue: boolean
  isPendingReview: boolean
  completed: boolean
}): "default" | "secondary" | "destructive" {
  if (isOverdue || isPendingReview) return "destructive"
  if (completed) return "default"
  return "secondary"
}
