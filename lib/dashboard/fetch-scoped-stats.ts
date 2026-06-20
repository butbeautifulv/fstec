import "server-only"

import { Prisma } from "@prisma/client"
import { prismaRead } from "@/lib/db"
import {
  OVERDUE_LABEL,
  STATUS_DISPLAY_ORDER,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"
import type {
  BreakdownRow,
  DashboardScope,
  ScopedDashboardStats,
  StatusBreakdownRow,
  StatusDistribution,
} from "@/lib/dashboard/stats"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type StatusCountRow = { display_status: string; count: number }
type BreakdownPivotRow = { label: string; display_status: string; count: number }

function scopeSqlFilter(scope: DashboardScope): Prisma.Sql {
  if (scope.type === "organization") {
    return Prisma.sql`AND o.organization_id = ${scope.organizationId}`
  }
  if (scope.type === "subdivision") {
    return Prisma.sql`AND o.organization_id = ${scope.organizationId} AND oi.subdivision_id = ${scope.subdivisionId}`
  }
  return Prisma.empty
}

function breakdownLabelSql(scope: DashboardScope): Prisma.Sql {
  if (scope.type === "global") {
    return Prisma.sql`org.name`
  }
  if (scope.type === "organization") {
    return Prisma.sql`COALESCE(sub.name, 'Без подразделения')`
  }
  return Prisma.sql`o.title`
}

function displayStatusSql(now: Date): Prisma.Sql {
  return Prisma.sql`
    CASE
      WHEN NOT s.is_terminal AND oi.due_at < ${now} THEN ${OVERDUE_LABEL}
      ELSE s.name
    END
  `
}

function fromBaseSql(scope: DashboardScope, now: Date) {
  return Prisma.sql`
    FROM order_items oi
    INNER JOIN statuses s ON oi.status_id = s.id
    INNER JOIN orders o ON oi.order_id = o.id
    INNER JOIN organizations org ON o.organization_id = org.organization_id
    LEFT JOIN subdivisions sub ON oi.subdivision_id = sub.id
    WHERE 1 = 1
    ${scopeSqlFilter(scope)}
  `
}

function buildStatusDistribution(rows: StatusCountRow[]): StatusDistribution[] {
  const statusCounts = new Map(rows.map((row) => [row.display_status, row.count]))

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

function buildBreakdownRows(
  pivotRows: BreakdownPivotRow[]
): { overdueBreakdown: BreakdownRow[]; statusBreakdown: StatusBreakdownRow[] } {
  const overdueByLabel = new Map<string, { count: number; total: number }>()
  const statusByLabel = new Map<string, Omit<StatusBreakdownRow, "label">>()

  for (const row of pivotRows) {
    const overdueEntry = overdueByLabel.get(row.label) ?? { count: 0, total: 0 }
    overdueEntry.total += row.count
    if (row.display_status === OVERDUE_LABEL) {
      overdueEntry.count += row.count
    }
    overdueByLabel.set(row.label, overdueEntry)

    const statusEntry = statusByLabel.get(row.label) ?? emptyStatusBreakdown()
    const key = row.display_status as keyof typeof statusEntry
    if (key in statusEntry) {
      statusEntry[key] += row.count
    }
    statusByLabel.set(row.label, statusEntry)
  }

  return {
    overdueBreakdown: [...overdueByLabel.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => b.count - a.count),
    statusBreakdown: [...statusByLabel.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}

function chartLabels(scope: DashboardScope["type"]) {
  switch (scope) {
    case "global":
      return {
        overdueTitle: "Просроченные по организациям",
        completionTitle: "Выполнение по организациям",
      }
    case "organization":
      return {
        overdueTitle: "Просроченные по подразделениям",
        completionTitle: "Выполнение по подразделениям",
      }
    case "subdivision":
      return {
        overdueTitle: "Просроченные по поручениям",
        completionTitle: "Выполнение по поручениям",
      }
  }
}

export async function fetchScopedStats(
  scope: DashboardScope,
  now: Date = new Date()
): Promise<ScopedDashboardStats> {
  const base = fromBaseSql(scope, now)
  const displayStatus = displayStatusSql(now)
  const breakdownLabel = breakdownLabelSql(scope)

  const [statusRows, pivotRows] = await Promise.all([
    prismaRead.$queryRaw<StatusCountRow[]>`
      SELECT display_status, COUNT(*)::int AS count
      FROM (
        SELECT ${displayStatus} AS display_status
        ${base}
      ) scoped
      GROUP BY display_status
    `,
    prismaRead.$queryRaw<BreakdownPivotRow[]>`
      SELECT label, display_status, COUNT(*)::int AS count
      FROM (
        SELECT
          ${breakdownLabel} AS label,
          ${displayStatus} AS display_status
        ${base}
      ) scoped
      GROUP BY label, display_status
    `,
  ])

  const { overdueBreakdown, statusBreakdown } = buildBreakdownRows(pivotRows)

  return {
    scope: scope.type,
    statusDistribution: buildStatusDistribution(statusRows),
    overdueBreakdown,
    statusBreakdown,
    chartLabels: chartLabels(scope.type),
  }
}
