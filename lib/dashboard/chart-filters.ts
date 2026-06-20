import type { ColumnFiltersState } from "@tanstack/react-table"
import type { DashboardScope } from "@/lib/dashboard/stats"
import { OVERDUE_LABEL, WORKFLOW_STATUS } from "@/lib/statuses/workflow"

export type ChartFilterScope = DashboardScope["type"]

export function breakdownColumnId(scope: ChartFilterScope): string {
  switch (scope) {
    case "global":
      return "organization"
    case "organization":
      return "subdivisionName"
    case "subdivision":
      return "orderTitle"
  }
}

export function overdueInitialFilters(): ColumnFiltersState {
  return [{ id: "status", value: [OVERDUE_LABEL] }]
}

export const NON_OVERDUE_STATUSES = [
  WORKFLOW_STATUS.NOT_STARTED,
  WORKFLOW_STATUS.IN_PROGRESS,
  WORKFLOW_STATUS.COMPLETED,
] as const

export type OverdueChartSegment = "overdue" | "nonOverdue"

function overdueSegmentStatuses(segment: OverdueChartSegment): string[] {
  return segment === "overdue" ? [OVERDUE_LABEL] : [...NON_OVERDUE_STATUSES]
}

function statusFilterMatches(
  filters: ColumnFiltersState,
  expected: string[]
): boolean {
  return arraysEqual(
    [...filterValues(filters, "status")].sort(),
    [...expected].sort()
  )
}

function filterValues(filters: ColumnFiltersState, id: string): string[] {
  return (filters.find((f) => f.id === id)?.value as string[]) ?? []
}

function setFilter(
  filters: ColumnFiltersState,
  id: string,
  values: string[] | undefined
): ColumnFiltersState {
  const rest = filters.filter((f) => f.id !== id)
  if (!values?.length) return rest
  return [...rest, { id, value: values }]
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((v, i) => v === sortedB[i])
}

export function toggleStatusFilter(
  filters: ColumnFiltersState,
  status: string
): ColumnFiltersState {
  const current = filterValues(filters, "status")
  if (current.length === 1 && current[0] === status) {
    return setFilter(filters, "status", undefined)
  }
  const withoutBreakdown = filters.filter(
    (f) =>
      f.id !== "organization" &&
      f.id !== "subdivisionName" &&
      f.id !== "orderTitle"
  )
  return setFilter(withoutBreakdown, "status", [status])
}

export function toggleStatusFilterPreserveBreakdown(
  filters: ColumnFiltersState,
  status: string
): ColumnFiltersState {
  const current = filterValues(filters, "status")
  if (current.length === 1 && current[0] === status) {
    return setFilter(filters, "status", undefined)
  }
  return setFilter(filters, "status", [status])
}

export function toggleOverdueSegmentFilter(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  segment: OverdueChartSegment
): ColumnFiltersState {
  const columnId = breakdownColumnId(scope)
  const statusValues = overdueSegmentStatuses(segment)
  const breakdownCurrent = filterValues(filters, columnId)

  if (
    breakdownCurrent.length === 1 &&
    breakdownCurrent[0] === label &&
    statusFilterMatches(filters, statusValues)
  ) {
    return filters.filter((f) => f.id !== columnId && f.id !== "status")
  }

  const rest = filters.filter((f) => f.id !== columnId && f.id !== "status")
  return [
    ...rest,
    { id: columnId, value: [label] },
    { id: "status", value: statusValues },
  ]
}

export function toggleOverdueLegendFilter(
  filters: ColumnFiltersState,
  segment: OverdueChartSegment
): ColumnFiltersState {
  const statusValues = overdueSegmentStatuses(segment)
  const hasOnlySegmentStatus =
    statusFilterMatches(filters, statusValues) &&
    !filters.some(
      (f) =>
        f.id === "organization" ||
        f.id === "subdivisionName" ||
        f.id === "orderTitle"
    )

  if (hasOnlySegmentStatus) {
    return filters.filter((f) => f.id !== "status")
  }

  const withoutBreakdown = filters.filter(
    (f) =>
      f.id !== "organization" &&
      f.id !== "subdivisionName" &&
      f.id !== "orderTitle"
  )
  return setFilter(withoutBreakdown, "status", statusValues)
}

export function toggleBreakdownFilter(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string
): ColumnFiltersState {
  const columnId = breakdownColumnId(scope)
  const current = filterValues(filters, columnId)
  if (current.length === 1 && current[0] === label) {
    return setFilter(filters, columnId, undefined)
  }
  const withoutStatus = setFilter(filters, "status", undefined)
  return setFilter(withoutStatus, columnId, [label])
}

export function toggleStatusBreakdownFilter(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  status: string
): ColumnFiltersState {
  const columnId = breakdownColumnId(scope)
  const breakdownCurrent = filterValues(filters, columnId)
  const statusCurrent = filterValues(filters, "status")

  if (
    breakdownCurrent.length === 1 &&
    breakdownCurrent[0] === label &&
    statusCurrent.length === 1 &&
    statusCurrent[0] === status
  ) {
    return filters.filter((f) => f.id !== columnId && f.id !== "status")
  }

  const rest = filters.filter((f) => f.id !== columnId && f.id !== "status")
  return [
    ...rest,
    { id: columnId, value: [label] },
    { id: "status", value: [status] },
  ]
}

/** @deprecated Use toggleStatusBreakdownFilter */
export function toggleCompletionSegmentFilter(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  segment: "completed" | "active"
): ColumnFiltersState {
  const columnId = breakdownColumnId(scope)
  const statusValues =
    segment === "completed"
      ? [WORKFLOW_STATUS.COMPLETED]
      : [WORKFLOW_STATUS.NOT_STARTED, WORKFLOW_STATUS.IN_PROGRESS, OVERDUE_LABEL]

  const breakdownCurrent = filterValues(filters, columnId)
  const statusCurrent = filterValues(filters, "status")

  if (
    breakdownCurrent.length === 1 &&
    breakdownCurrent[0] === label &&
    arraysEqual(statusCurrent, statusValues)
  ) {
    return filters.filter((f) => f.id !== columnId && f.id !== "status")
  }

  const rest = filters.filter((f) => f.id !== columnId && f.id !== "status")
  return [
    ...rest,
    { id: columnId, value: [label] },
    { id: "status", value: statusValues },
  ]
}

export function isStatusFilterActive(
  filters: ColumnFiltersState,
  status: string
): boolean {
  const values = filterValues(filters, "status")
  return values.length === 1 && values[0] === status
}

export function isBreakdownFilterActive(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string
): boolean {
  const values = filterValues(filters, breakdownColumnId(scope))
  return values.length === 1 && values[0] === label
}

export function isOverdueSegmentHighlighted(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  segment: OverdueChartSegment
): boolean {
  const statusValues = overdueSegmentStatuses(segment)
  const breakdownMatch = isBreakdownFilterActive(filters, scope, label)
  const statusMatch = statusFilterMatches(filters, statusValues)
  const hasBreakdown = filters.some((f) => f.id === breakdownColumnId(scope))
  const hasStatus = filters.some((f) => f.id === "status")

  if (hasBreakdown && hasStatus) return breakdownMatch && statusMatch
  if (hasBreakdown) return breakdownMatch
  if (hasStatus) return statusMatch
  return false
}

export function isOverdueLegendActive(
  filters: ColumnFiltersState,
  segment: OverdueChartSegment
): boolean {
  return (
    statusFilterMatches(filters, overdueSegmentStatuses(segment)) &&
    !filters.some(
      (f) =>
        f.id === "organization" ||
        f.id === "subdivisionName" ||
        f.id === "orderTitle"
    )
  )
}

export function isStatusBreakdownActive(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  status: string
): boolean {
  return (
    isBreakdownFilterActive(filters, scope, label) &&
    filterValues(filters, "status").length === 1 &&
    filterValues(filters, "status")[0] === status
  )
}

export function isStatusSegmentHighlighted(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  status: string
): boolean {
  const breakdownMatch = isBreakdownFilterActive(filters, scope, label)
  const statusMatch = isStatusFilterActive(filters, status)
  const hasBreakdown = filters.some((f) => f.id === breakdownColumnId(scope))
  const hasStatus = filters.some((f) => f.id === "status")

  if (hasBreakdown && hasStatus) return breakdownMatch && statusMatch
  if (hasBreakdown) return breakdownMatch
  if (hasStatus) return statusMatch
  return false
}

/** @deprecated Use isStatusBreakdownActive */
export function isCompletionSegmentActive(
  filters: ColumnFiltersState,
  scope: ChartFilterScope,
  label: string,
  segment: "completed" | "active"
): boolean {
  const statusValues =
    segment === "completed"
      ? [WORKFLOW_STATUS.COMPLETED]
      : [WORKFLOW_STATUS.NOT_STARTED, WORKFLOW_STATUS.IN_PROGRESS, OVERDUE_LABEL]

  return (
    isBreakdownFilterActive(filters, scope, label) &&
    arraysEqual(filterValues(filters, "status"), statusValues)
  )
}

export function hasChartLinkedFilters(filters: ColumnFiltersState): boolean {
  return filters.some(
    (f) =>
      f.id === "status" ||
      f.id === "organization" ||
      f.id === "subdivisionName" ||
      f.id === "orderTitle"
  )
}
