import type { DashboardMatrixItem } from "@/lib/dashboard/build-matrix"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"

/** Dashboard matrix row after server serialization. */
export type SerializedMatrixItem = {
  id: number
  orderId: number
  dueAt: string
  isOverdue: boolean
  measure: {
    id: number
    name: string
    code: string | null
    description: string | null
  }
  order: {
    title: string
    issuedAt: string
    organization: { id: number; name: string }
  }
  status: { id: number; name: string; isTerminal: boolean }
  subdivision?: { id: number; name: string } | null
}

/** Alias for dashboard matrix table components. */
export type DashboardMatrixRow = SerializedMatrixItem

export type SerializedDashboardDto = {
  stats: ScopedDashboardStats
  items: SerializedMatrixItem[]
}

export function serializeDashboardDto(
  data: {
    stats: ScopedDashboardStats
    items: DashboardMatrixItem[]
  },
  options?: { limit?: number }
): SerializedDashboardDto {
  const items =
    options?.limit != null && options.limit > 0
      ? data.items.slice(0, options.limit)
      : data.items

  return {
    stats: data.stats,
    items: items.map(serializeMatrixItem),
  }
}

function serializeMatrixItem(item: DashboardMatrixItem): SerializedMatrixItem {
  return {
    id: item.id,
    orderId: item.orderId,
    dueAt: item.dueAt.toISOString(),
    isOverdue: item.isOverdue,
    measure: item.measure,
    order: {
      title: item.order.title,
      issuedAt: item.order.issuedAt.toISOString(),
      organization: item.order.organization,
    },
    status: item.status,
    subdivision: item.subdivision ?? null,
  }
}
