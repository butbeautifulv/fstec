import "server-only"

import { getCachedJson } from "@/lib/cache/json-cache"
import { getReferenceCacheTtl } from "@/lib/cache/redis"
import { prisma } from "@/lib/db"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const WORKFLOW_STATUS_NAMES = [
  WORKFLOW_STATUS.IN_PROGRESS,
  WORKFLOW_STATUS.COMPLETED,
] as const

export function getCachedWorkflowStatuses() {
  return getCachedJson("ref:workflow-statuses", getReferenceCacheTtl(), () =>
    prisma.status.findMany({
      where: { name: { in: [...WORKFLOW_STATUS_NAMES] } },
      orderBy: { sortOrder: "asc" },
    })
  )
}
