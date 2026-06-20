export type MeasuresTableStatus = {
  id: number
  name: string
  isTerminal: boolean
}

export type MeasuresTableItem = {
  id: number
  orderId?: number
  dueAt: string
  measure: { name: string; code: string | null; description?: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderTitle?: string
  subdivisionName?: string | null
}
