import type { ColumnFiltersState } from "@tanstack/react-table"
import type { Prisma } from "@prisma/client"
import {
  breakdownColumnId,
  NON_OVERDUE_STATUSES,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import type { DashboardScope } from "@/lib/dashboard/stats"
import { OVERDUE_LABEL } from "@/lib/statuses/workflow"

export const DEFAULT_MATRIX_LIMIT = 50
export const FILTERED_MATRIX_LIMIT = 200

export type DashboardMatrixQuery = {
  overdueOnly: boolean
  displayStatuses?: string[]
  breakdownLabel?: string
}

export type DashboardSearchParams = {
  overdue?: string
  status?: string
  label?: string
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

export function hasMatrixFilters(query: DashboardMatrixQuery): boolean {
  return Boolean(
    query.overdueOnly ||
      query.breakdownLabel ||
      (query.displayStatuses && query.displayStatuses.length > 0)
  )
}

export function resolveMatrixLimit(query: DashboardMatrixQuery): number {
  return hasMatrixFilters(query) ? FILTERED_MATRIX_LIMIT : DEFAULT_MATRIX_LIMIT
}

export function parseDashboardSearchParams(
  params: DashboardSearchParams
): DashboardMatrixQuery {
  const overdueOnly = params.overdue === "1"
  const displayStatuses = params.status
    ? params.status.split(",").map((value) => value.trim()).filter(Boolean)
    : undefined
  const breakdownLabel = params.label?.trim() || undefined

  return {
    overdueOnly,
    displayStatuses: displayStatuses?.length ? displayStatuses : undefined,
    breakdownLabel,
  }
}

export function buildDashboardHref(
  baseHref: string,
  query: DashboardMatrixQuery
): string {
  const params = new URLSearchParams()

  if (query.overdueOnly) {
    params.set("overdue", "1")
  }

  if (query.displayStatuses?.length) {
    params.set("status", query.displayStatuses.join(","))
  }

  if (query.breakdownLabel) {
    params.set("label", query.breakdownLabel)
  }

  const qs = params.toString()
  return qs ? `${baseHref}?${qs}` : baseHref
}

export function matrixQueryToColumnFilters(
  scope: ChartFilterScope,
  query: DashboardMatrixQuery
): ColumnFiltersState {
  const filters: ColumnFiltersState = []

  if (query.breakdownLabel) {
    filters.push({
      id: breakdownColumnId(scope),
      value: [query.breakdownLabel],
    })
  }

  if (query.displayStatuses?.length) {
    filters.push({ id: "status", value: query.displayStatuses })
  } else if (query.overdueOnly) {
    filters.push({ id: "status", value: [OVERDUE_LABEL] })
  }

  return filters
}

function toggleStatusValues(current: string[] | undefined, status: string): string[] | undefined {
  if (current?.length === 1 && current[0] === status) {
    return undefined
  }
  return [status]
}

export function toggleMatrixStatusFilter(
  query: DashboardMatrixQuery,
  status: string
): DashboardMatrixQuery {
  return {
    overdueOnly: false,
    displayStatuses: toggleStatusValues(query.displayStatuses, status),
    breakdownLabel: undefined,
  }
}

export function toggleMatrixStatusFilterPreserveBreakdown(
  query: DashboardMatrixQuery,
  status: string
): DashboardMatrixQuery {
  return {
    ...query,
    overdueOnly: false,
    displayStatuses: toggleStatusValues(query.displayStatuses, status),
  }
}

export function toggleMatrixBreakdownFilter(
  query: DashboardMatrixQuery,
  label: string
): DashboardMatrixQuery {
  const isActive =
    query.breakdownLabel === label &&
    !query.displayStatuses?.length &&
    !query.overdueOnly

  return {
    overdueOnly: false,
    displayStatuses: undefined,
    breakdownLabel: isActive ? undefined : label,
  }
}

export function toggleMatrixOverdueSegmentFilter(
  query: DashboardMatrixQuery,
  label: string,
  segment: "overdue" | "nonOverdue"
): DashboardMatrixQuery {
  const statusValues =
    segment === "overdue" ? [OVERDUE_LABEL] : [...NON_OVERDUE_STATUSES]
  const isActive =
    query.breakdownLabel === label &&
    query.displayStatuses &&
    arraysEqual(query.displayStatuses, statusValues)

  if (isActive) {
    return {
      overdueOnly: false,
      displayStatuses: undefined,
      breakdownLabel: undefined,
    }
  }

  return {
    overdueOnly: false,
    displayStatuses: statusValues,
    breakdownLabel: label,
  }
}

export function toggleMatrixOverdueLegendFilter(
  query: DashboardMatrixQuery,
  segment: "overdue" | "nonOverdue"
): DashboardMatrixQuery {
  const statusValues =
    segment === "overdue" ? [OVERDUE_LABEL] : [...NON_OVERDUE_STATUSES]
  const isActive =
    !query.breakdownLabel &&
    query.displayStatuses &&
    arraysEqual(query.displayStatuses, statusValues)

  if (isActive) {
    return {
      overdueOnly: false,
      displayStatuses: undefined,
      breakdownLabel: undefined,
    }
  }

  return {
    overdueOnly: false,
    displayStatuses: statusValues,
    breakdownLabel: undefined,
  }
}

export function toggleMatrixStatusBreakdownFilter(
  query: DashboardMatrixQuery,
  label: string,
  status: string
): DashboardMatrixQuery {
  const isActive =
    query.breakdownLabel === label &&
    query.displayStatuses?.length === 1 &&
    query.displayStatuses[0] === status

  if (isActive) {
    return {
      overdueOnly: false,
      displayStatuses: undefined,
      breakdownLabel: undefined,
    }
  }

  return {
    overdueOnly: false,
    displayStatuses: [status],
    breakdownLabel: label,
  }
}

export function statsItemTotal(stats: {
  statusDistribution: { count: number }[]
}): number {
  return stats.statusDistribution.reduce((sum, row) => sum + row.count, 0)
}
