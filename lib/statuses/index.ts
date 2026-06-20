import { cache } from "react"
import { getCachedWorkflowStatuses } from "@/lib/cache/workflow-statuses"
import { prisma } from "@/lib/db"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

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

export const getWorkflowStatuses = cache(() => getCachedWorkflowStatuses())

export const listSelectableStatuses = cache(() => getCachedWorkflowStatuses())
