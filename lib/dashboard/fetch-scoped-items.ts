import { prismaRead } from "@/lib/db"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { Prisma } from "@prisma/client"

function buildOrderWhere(scope: DashboardScope): Prisma.OrderWhereInput {
  const orderWhere: Prisma.OrderWhereInput = {}

  if (scope.type === "organization") {
    orderWhere.organizationId = scope.organizationId
  }

  if (scope.issuedFrom || scope.issuedTo) {
    orderWhere.issuedAt = {
      ...(scope.issuedFrom ? { gte: scope.issuedFrom } : {}),
      ...(scope.issuedTo ? { lte: scope.issuedTo } : {}),
    }
  }

  return orderWhere
}

export async function fetchScopedItems(scope: DashboardScope) {
  const orderWhere = buildOrderWhere(scope)

  return prismaRead.orderItem.findMany({
    where: {
      ...(Object.keys(orderWhere).length > 0 ? { order: orderWhere } : {}),
      ...(scope.type === "subdivision" && {
        order: {
          ...orderWhere,
          organizationId: scope.organizationId,
        },
        subdivisionId: scope.subdivisionId,
      }),
    },
    select: {
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
    },
    orderBy: [{ order: { organization: { name: "asc" } } }, { measure: { name: "asc" } }],
  })
}

export type ScopedDashboardItem = Awaited<ReturnType<typeof fetchScopedItems>>[number]
