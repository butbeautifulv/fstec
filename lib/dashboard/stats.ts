import { prisma } from "@/lib/db"
import {
  getDisplayStatusName,
  isOrderItemOverdue,
  STATUS_DISPLAY_ORDER,
} from "@/lib/statuses/workflow"

export type StatusDistribution = { status: string; count: number; fill: string }

export type BreakdownRow = { label: string; count: number }

export type CompletionRow = {
  label: string
  completed: number
  active: number
}

export type DashboardScope =
  | { type: "global" }
  | { type: "organization"; organizationId: number }
  | { type: "subdivision"; organizationId: number; subdivisionId: number }

export type ScopedDashboardStats = {
  scope: DashboardScope["type"]
  statusDistribution: StatusDistribution[]
  overdueBreakdown: BreakdownRow[]
  completionBreakdown: CompletionRow[]
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

type ItemRow = Awaited<ReturnType<typeof fetchScopedItems>>[number]

async function fetchScopedItems(scope: DashboardScope) {
  return prisma.orderItem.findMany({
    where: {
      ...(scope.type === "organization" && {
        order: { organizationId: scope.organizationId },
      }),
      ...(scope.type === "subdivision" && {
        order: { organizationId: scope.organizationId },
        subdivisionId: scope.subdivisionId,
      }),
    },
    include: {
      status: true,
      subdivision: true,
      order: { include: { organization: true } },
    },
  })
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

function buildGlobalStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueByOrg = new Map<string, number>()
  const completionByOrg = new Map<string, { completed: number; active: number }>()

  for (const item of items) {
    const orgName = item.order.organization.name
    const entry = completionByOrg.get(orgName) ?? { completed: 0, active: 0 }
    if (item.status.isTerminal) entry.completed += 1
    else entry.active += 1
    completionByOrg.set(orgName, entry)

    if (isOrderItemOverdue(item, now)) {
      overdueByOrg.set(orgName, (overdueByOrg.get(orgName) ?? 0) + 1)
    }
  }

  return {
    scope: "global",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueByOrg.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    completionBreakdown: [...completionByOrg.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    chartLabels: {
      overdueTitle: "Просроченные по организациям",
      completionTitle: "Выполнение по организациям",
    },
  }
}

function buildOrganizationStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueBySub = new Map<string, number>()
  const completionBySub = new Map<string, { completed: number; active: number }>()

  for (const item of items) {
    const label = item.subdivision?.name ?? "Без подразделения"
    const entry = completionBySub.get(label) ?? { completed: 0, active: 0 }
    if (item.status.isTerminal) entry.completed += 1
    else entry.active += 1
    completionBySub.set(label, entry)

    if (isOrderItemOverdue(item, now)) {
      overdueBySub.set(label, (overdueBySub.get(label) ?? 0) + 1)
    }
  }

  return {
    scope: "organization",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueBySub.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    completionBreakdown: [...completionBySub.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    chartLabels: {
      overdueTitle: "Просроченные по подразделениям",
      completionTitle: "Выполнение по подразделениям",
    },
  }
}

function buildSubdivisionStats(items: ItemRow[], now: Date): ScopedDashboardStats {
  const overdueByOrder = new Map<string, number>()
  let completed = 0
  let active = 0

  for (const item of items) {
    if (item.status.isTerminal) completed += 1
    else active += 1

    if (isOrderItemOverdue(item, now)) {
      overdueByOrder.set(item.order.title, (overdueByOrder.get(item.order.title) ?? 0) + 1)
    }
  }

  const scopeLabel = items[0]?.subdivision?.name ?? "Подразделение"

  return {
    scope: "subdivision",
    statusDistribution: buildStatusDistribution(items, now),
    overdueBreakdown: [...overdueByOrder.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    completionBreakdown: [{ label: scopeLabel, completed, active }],
    chartLabels: {
      overdueTitle: "Просроченные по поручениям",
      completionTitle: "Выполнение",
    },
  }
}

export async function getScopedDashboardStats(
  scope: DashboardScope
): Promise<ScopedDashboardStats> {
  const items = await fetchScopedItems(scope)
  const now = new Date()

  if (scope.type === "global") return buildGlobalStats(items, now)
  if (scope.type === "organization") return buildOrganizationStats(items, now)
  return buildSubdivisionStats(items, now)
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
    completionByOrganization: stats.completionBreakdown.map((r) => ({
      org: r.label,
      completed: r.completed,
      active: r.active,
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
