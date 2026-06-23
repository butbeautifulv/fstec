import type { StatusBreakdownRow, StatusDistribution } from "@/lib/dashboard/stats"
import type { DashboardStatusName } from "@/lib/statuses/workflow"

export function isChartStatusVisible(
  visible: ReadonlySet<string> | undefined,
  status: string
): boolean {
  return visible?.has(status) ?? true
}

export function canHideChartCategory(visible: ReadonlySet<string>): boolean {
  return visible.size > 1
}

export function toggleChartCategoryVisibility(
  visible: ReadonlySet<string>,
  status: string,
  order: readonly string[]
): Set<string> {
  const next = new Set(visible)
  if (next.has(status)) {
    if (!canHideChartCategory(next)) return next
    next.delete(status)
    return next
  }
  next.add(status)
  return normalizeVisibleStatuses(next, order)
}

function normalizeVisibleStatuses(
  visible: Set<string>,
  order: readonly string[]
): Set<string> {
  const normalized = new Set<string>()
  for (const status of order) {
    if (visible.has(status)) normalized.add(status)
  }
  if (normalized.size === 0 && order.length > 0) {
    normalized.add(order[0]!)
  }
  return normalized
}

export function filterStatusDistribution(
  distribution: StatusDistribution[],
  visible: ReadonlySet<string>
): StatusDistribution[] {
  return distribution.filter((row) => isChartStatusVisible(visible, row.status))
}

export function visibleStatusesInOrder(
  order: readonly string[],
  visible: ReadonlySet<string>
): string[] {
  return order.filter((status) => isChartStatusVisible(visible, status))
}

export function sumVisibleBreakdown(
  row: Omit<StatusBreakdownRow, "label">,
  visible: ReadonlySet<string>,
  order: readonly DashboardStatusName[]
): number {
  return order.reduce((sum, status) => {
    if (!isChartStatusVisible(visible, status)) return sum
    return sum + row[status]
  }, 0)
}

export function sumVisibleBreakdownRows(
  rows: StatusBreakdownRow[],
  visible: ReadonlySet<string>,
  order: readonly DashboardStatusName[]
): Record<DashboardStatusName, number> {
  const totals = Object.fromEntries(order.map((status) => [status, 0])) as Record<
    DashboardStatusName,
    number
  >
  for (const row of rows) {
    for (const status of order) {
      if (isChartStatusVisible(visible, status)) {
        totals[status] += row[status]
      }
    }
  }
  return totals
}

export function visibleBreakdownGrandTotal(
  rows: StatusBreakdownRow[],
  visible: ReadonlySet<string>,
  order: readonly DashboardStatusName[]
): number {
  return rows.reduce(
    (sum, row) => sum + sumVisibleBreakdown(row, visible, order),
    0
  )
}

export function defaultVisibleChartStatuses(
  order: readonly string[]
): Set<string> {
  return new Set(order)
}

export function setVisibleChartStatuses(
  selected: ReadonlySet<string>,
  order: readonly string[]
): Set<string> {
  return normalizeVisibleStatuses(new Set(selected), order)
}

export function hiddenChartStatusCount(
  visible: ReadonlySet<string> | undefined,
  order: readonly string[]
): number {
  if (!visible) return 0
  return order.filter((status) => !visible.has(status)).length
}
