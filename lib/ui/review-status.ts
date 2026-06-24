export const REVIEW_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS]

export function isReviewPending(status: ReviewStatus): boolean {
  return status === REVIEW_STATUS.PENDING
}

export function isReviewRejected(status: ReviewStatus): boolean {
  return status === REVIEW_STATUS.REJECTED
}

export function isReviewAccepted(status: ReviewStatus): boolean {
  return status === REVIEW_STATUS.ACCEPTED
}
