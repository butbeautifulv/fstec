import { prisma } from "@/lib/db"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const WORKFLOW_STATUS_NAMES = [
  WORKFLOW_STATUS.NOT_STARTED,
  WORKFLOW_STATUS.IN_PROGRESS,
  WORKFLOW_STATUS.COMPLETED,
] as const

async function getStatusIdByName(name: string) {
  const status = await prisma.status.findFirst({ where: { name } })
  if (!status) throw new Error(`Status not found: ${name}`)
  return status.id
}

export async function getDefaultStatusId() {
  return getStatusIdByName(WORKFLOW_STATUS.NOT_STARTED)
}

export async function getInProgressStatusId() {
  return getStatusIdByName(WORKFLOW_STATUS.IN_PROGRESS)
}

export async function getCompletedStatusId() {
  return getStatusIdByName(WORKFLOW_STATUS.COMPLETED)
}

export function getWorkflowStatuses() {
  return prisma.status.findMany({
    where: { name: { in: [...WORKFLOW_STATUS_NAMES] } },
    orderBy: { sortOrder: "asc" },
  })
}

export function listSelectableStatuses() {
  return getWorkflowStatuses()
}
