export type TrackedItemStatus = {
  id: number
  name: string
  isTerminal: boolean
}

export type TrackedItemRow = {
  id: number
  orderId?: number
  dueAt: string
  measure: { name: string; code: string | null; description?: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderTitle?: string
  subdivisionName?: string | null
  subdivisionId?: number | null
}

export type TrackedItemsColumnPreset = {
  showSubdivisionColumn?: boolean
  showOrderColumn?: boolean
  subdivisionHref?: (subdivisionId: number) => string
  actionLabel?: string
}
