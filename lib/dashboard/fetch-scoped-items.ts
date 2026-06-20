import { prismaRead } from "@/lib/db"
import type { DashboardScope } from "@/lib/dashboard/stats"

export async function fetchScopedItems(scope: DashboardScope) {
  return prismaRead.orderItem.findMany({
    where: {
      ...(scope.type === "organization" && {
        order: { organizationId: scope.organizationId },
      }),
      ...(scope.type === "subdivision" && {
        order: { organizationId: scope.organizationId },
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
