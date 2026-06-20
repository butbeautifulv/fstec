import {
  getDisplayStatusName,
  isOrderItemOverdue,
  OVERDUE_LABEL,
  STATUS_DISPLAY_ORDER,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"
import type { ScopedDashboardItem } from "@/lib/dashboard/fetch-scoped-items"
import { fetchScopedStats } from "@/lib/dashboard/fetch-scoped-stats"

export type StatusDistribution = { status: string; count: number; fill: string }

export type BreakdownRow = { label: string; count: number; total: number }

export type StatusBreakdownRow = {
  label: string
} & {
  [K in (typeof STATUS_DISPLAY_ORDER)[number]]: number
}

export type DashboardScope =
  | { type: "global" }
  | { type: "organization"; organizationId: number }
  | { type: "subdivision"; organizationId: number; subdivisionId: number }

export type ScopedDashboardStats = {
  scope: DashboardScope["type"]
  statusDistribution: StatusDistribution[]
  overdueBreakdown: BreakdownRow[]
  statusBreakdown: StatusBreakdownRow[]
  chartLabels: {
    overdueTitle: string
    completionTitle: string
  }
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type ItemRow = ScopedDashboardItem

export function buildScopedStatsFromItems(
  scope: DashboardScope,
  items: ItemRow[],
  now: Date
): ScopedDashboardStats {
  if (scope.type === "global") return buildGlobalStats(items, now)
  if (scope.type === "organization") return buildOrganizationStats(items, now)
  return buildSubdivisionStats(items, now)
}

function buildStatusDistribution(items: ItemRow[], now: Date): StatusDistribution[] {
  const statusCounts = new Map<string, number>()
  for (const item of items) {
    const label = getDisplayStatusName(item, now)
    statusCounts.set(label, (statusCounts.get(label) ?? 0) + 1)
  }

  const ordered = STATUS_DISPLAY_ORDER.filter((status) => statusCounts.has(status)).map(
    (status, i) => ({
      status,
      count: statusCounts.get(status)!,
      fill: CHART_COLORS[i % CHART_COLORS.length] ?? "var(--chart-1)",
    })
  )

  const known = new Set<string>(STATUS_DISPLAY_ORDER)
  const extras = [...statusCounts.entries()]
    .filter(([status]) => !known.has(status))
    .map(([status, count], i) => ({
      status,
      count,
      fill: CHART_COLORS[(ordered.length + i) % CHART_COLORS.length] ?? "var(--chart-1)",
    }))

  return [...ordered, ...extras]
}

function emptyStatusBreakdown(): Omit<StatusBreakdownRow, "label"> {
  return {
    [WORKFLOW_STATUS.NOT_STARTED]: 0,
    [WORKFLOW_STATUS.IN_PROGRESS]: 0,
    [WORKFLOW_STATUS.COMPLETED]: 0,
    [OVERDUE_LABEL]: 0,
  }
}

function incrementStatusBreakdown(
  row: Omit<StatusBreakdownRow, "label">,
  item: ItemRow,
  now: Date
) {
  const status = getDisplayStatusName(item, now) as keyof typeof row
  if (status in row) row[status] += 1
}

function buildGlobalStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueByOrg = new Map<string, { count: number; total: number }>()
  const statusByOrg = new Map<string, Omit<StatusBreakdownRow, "label">>()

  for (const item of items) {
    const orgName = item.order.organization.name
    const statusEntry = statusByOrg.get(orgName) ?? emptyStatusBreakdown()
    incrementStatusBreakdown(statusEntry, item, now)
    statusByOrg.set(orgName, statusEntry)

    const overdueEntry = overdueByOrg.get(orgName) ?? { count: 0, total: 0 }
    overdueEntry.total += 1
    if (isOrderItemOverdue(item, now)) overdueEntry.count += 1
    overdueByOrg.set(orgName, overdueEntry)
  }

  return {
    scope: "global",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueByOrg.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.count - a.count),
    statusBreakdown: [...statusByOrg.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    chartLabels: {
      overdueTitle: "Просроченные по организациям",
      completionTitle: "Выполнение по организациям",
    },
  }
}

function buildOrganizationStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueBySub = new Map<string, { count: number; total: number }>()
  const statusBySub = new Map<string, Omit<StatusBreakdownRow, "label">>()

  for (const item of items) {
    const label = item.subdivision?.name ?? "Без подразделения"
    const statusEntry = statusBySub.get(label) ?? emptyStatusBreakdown()
    incrementStatusBreakdown(statusEntry, item, now)
    statusBySub.set(label, statusEntry)

    const overdueEntry = overdueBySub.get(label) ?? { count: 0, total: 0 }
    overdueEntry.total += 1
    if (isOrderItemOverdue(item, now)) overdueEntry.count += 1
    overdueBySub.set(label, overdueEntry)
  }

  return {
    scope: "organization",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueBySub.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.count - a.count),
    statusBreakdown: [...statusBySub.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    chartLabels: {
      overdueTitle: "Просроченные по подразделениям",
      completionTitle: "Выполнение по подразделениям",
    },
  }
}

function buildSubdivisionStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueByOrder = new Map<string, { count: number; total: number }>()
  const statusByOrder = new Map<string, Omit<StatusBreakdownRow, "label">>()

  for (const item of items) {
    const label = item.order.title
    const statusEntry = statusByOrder.get(label) ?? emptyStatusBreakdown()
    incrementStatusBreakdown(statusEntry, item, now)
    statusByOrder.set(label, statusEntry)

    const overdueEntry = overdueByOrder.get(label) ?? { count: 0, total: 0 }
    overdueEntry.total += 1
    if (isOrderItemOverdue(item, now)) overdueEntry.count += 1
    overdueByOrder.set(label, overdueEntry)
  }

  return {
    scope: "subdivision",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueByOrder.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.count - a.count),
    statusBreakdown: [...statusByOrder.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    chartLabels: {
      overdueTitle: "Просроченные по поручениям",
      completionTitle: "Выполнение по поручениям",
    },
  }
}

export async function getScopedDashboardStats(
  scope: DashboardScope
): Promise<ScopedDashboardStats> {
  return fetchScopedStats(scope)
}

/** @deprecated Use getScopedDashboardStats({ type: "global" }) */
export async function getDashboardStats() {
  const stats = await getScopedDashboardStats({ type: "global" })
  return {
    statusDistribution: stats.statusDistribution,
    overdueByOrganization: stats.overdueBreakdown.map((r) => ({
      org: r.label,
      count: r.count,
    })),
    completionByOrganization: stats.statusBreakdown.map((r) => ({
      org: r.label,
      completed: r[WORKFLOW_STATUS.COMPLETED],
      active:
        r[WORKFLOW_STATUS.NOT_STARTED] +
        r[WORKFLOW_STATUS.IN_PROGRESS] +
        r[OVERDUE_LABEL],
    })),
  }
}

export function scopeFromAccessLink(link: {
  organizationId: number
  subdivisionId: number | null
}): DashboardScope {
  if (link.subdivisionId != null) {
    return {
      type: "subdivision",
      organizationId: link.organizationId,
      subdivisionId: link.subdivisionId,
    }
  }
  return { type: "organization", organizationId: link.organizationId }
}
