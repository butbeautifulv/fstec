export const WORKFLOW_STATUS = {
  IN_PROGRESS: "В работе",
  COMPLETED: "Выполнено",
} as const

export const OVERDUE_LABEL = "Просрочено"

export const LEGACY_OVERDUE_STATUS = "Просрочено"

export const DASHBOARD_STATUS_ORDER = [
  WORKFLOW_STATUS.IN_PROGRESS,
  WORKFLOW_STATUS.COMPLETED,
  OVERDUE_LABEL,
] as const

export type DashboardStatusName = (typeof DASHBOARD_STATUS_ORDER)[number]

export type WorkflowStatusName =
  (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS]

export type OrderItemStatusLike = {
  status: { name: string; isTerminal?: boolean }
  dueAt: Date | string
}

export function isOrderItemOverdue(
  item: OrderItemStatusLike,
  now: Date = new Date()
): boolean {
  const terminal =
    item.status.isTerminal ?? item.status.name === WORKFLOW_STATUS.COMPLETED
  return !terminal && new Date(item.dueAt) < now
}

export function getDisplayStatusName(
  item: OrderItemStatusLike,
  now: Date = new Date()
): string {
  if (isOrderItemOverdue(item, now)) return OVERDUE_LABEL
  return item.status.name
}

export function getDashboardDisplayStatusName(
  item: OrderItemStatusLike,
  now: Date = new Date()
): string {
  return getDisplayStatusName(item, now)
}

export function isSelectableWorkflowStatus(name: string): boolean {
  return (
    name === WORKFLOW_STATUS.IN_PROGRESS || name === WORKFLOW_STATUS.COMPLETED
  )
}

export function isInProgress(statusName: string): boolean {
  return statusName === WORKFLOW_STATUS.IN_PROGRESS
}

export function isCompleted(status: { isTerminal: boolean; name?: string }): boolean {
  return status.isTerminal || status.name === WORKFLOW_STATUS.COMPLETED
}

export function canSubmitOrderItemReport(status: {
  name: string
  isTerminal: boolean
}): boolean {
  return isInProgress(status.name) && !isCompleted(status)
}
