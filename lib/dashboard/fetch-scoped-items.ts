import type { Prisma } from "@prisma/client"
import { prismaRead } from "@/lib/db"
import type { DashboardMatrixQuery } from "@/lib/dashboard/dashboard-query"
import type { DashboardScope } from "@/lib/dashboard/stats"
import { OVERDUE_LABEL } from "@/lib/statuses/workflow"

const itemSelect = {
  id: true,
  orderId: true,
  dueAt: true,
  subdivisionId: true,
  status: {
    select: { id: true, name: true, isTerminal: true },
  },
  measure: {
    select: { id: true, name: true, code: true, description: true },
  },
  subdivision: {
    select: { id: true, name: true },
  },
  order: {
    select: {
      id: true,
      title: true,
      issuedAt: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true },
      },
    },
  },
} as const

function overdueWhere(now: Date): Prisma.OrderItemWhereInput {
  return {
    status: { isTerminal: false },
    dueAt: { lt: now },
  }
}

function workflowStatusWhere(
  statusName: string,
  now: Date
): Prisma.OrderItemWhereInput {
  return {
    status: { name: statusName },
    OR: [{ status: { isTerminal: true } }, { dueAt: { gte: now } }],
  }
}

function displayStatusWhere(
  displayStatus: string,
  now: Date
): Prisma.OrderItemWhereInput {
  if (displayStatus === OVERDUE_LABEL) {
    return overdueWhere(now)
  }
  return workflowStatusWhere(displayStatus, now)
}

function breakdownLabelWhere(
  scope: DashboardScope,
  label: string
): Prisma.OrderItemWhereInput {
  if (scope.type === "global") {
    return { order: { organization: { name: label } } }
  }
  if (scope.type === "organization") {
    if (label === "Без подразделения") {
      return { subdivisionId: null }
    }
    return { subdivision: { name: label } }
  }
  return { order: { title: label } }
}

function scopeWhere(scope: DashboardScope): Prisma.OrderItemWhereInput {
  if (scope.type === "organization") {
    return { order: { organizationId: scope.organizationId } }
  }
  if (scope.type === "subdivision") {
    return {
      order: { organizationId: scope.organizationId },
      subdivisionId: scope.subdivisionId,
    }
  }
  return {}
}

export function buildMatrixItemWhere(
  scope: DashboardScope,
  query: DashboardMatrixQuery,
  now: Date = new Date()
): Prisma.OrderItemWhereInput {
  const and: Prisma.OrderItemWhereInput[] = []

  if (query.overdueOnly) {
    and.push(overdueWhere(now))
  }

  if (query.displayStatuses?.length) {
    and.push({
      OR: query.displayStatuses.map((status) => displayStatusWhere(status, now)),
    })
  }

  if (query.breakdownLabel) {
    and.push(breakdownLabelWhere(scope, query.breakdownLabel))
  }

  const scoped = scopeWhere(scope)
  if (and.length === 0) {
    return scoped
  }

  return {
    ...scoped,
    AND: and,
  }
}

export async function fetchScopedItems(
  scope: DashboardScope,
  query?: DashboardMatrixQuery,
  now: Date = new Date()
) {
  const matrixQuery = query ?? { overdueOnly: false }

  return prismaRead.orderItem.findMany({
    where: buildMatrixItemWhere(scope, matrixQuery, now),
    select: itemSelect,
    orderBy: [{ order: { organization: { name: "asc" } } }, { measure: { name: "asc" } }],
  })
}

export type ScopedDashboardItem = Awaited<ReturnType<typeof fetchScopedItems>>[number]
