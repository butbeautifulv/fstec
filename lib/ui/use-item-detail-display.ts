"use client"

import { useMemo } from "react"
import type { ReviewStatus } from "@/lib/ui/review-status"
import { getItemDetailDisplayState } from "@/lib/ui/item-detail-display"

type ItemDetailItemLike = {
  dueAt: string
  status: { name: string; isTerminal?: boolean }
}

type ItemDetailLatestResponseLike = {
  reviewStatus: ReviewStatus
} | null | undefined

export function useItemDetailDisplay(
  item: ItemDetailItemLike,
  latestResponse?: ItemDetailLatestResponseLike
) {
  return useMemo(
    () => getItemDetailDisplayState(item, latestResponse),
    [item, latestResponse]
  )
}
