import { notFound } from "next/navigation"
import { PublicDashboardPage } from "@/components/public/public-dashboard-page"
import type { PublicItem } from "@/components/public/public-measures-table"
import { getScopedDashboardStats, scopeFromAccessLink } from "@/lib/dashboard/stats"
import { validateAccessToken } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export default async function PublicLinkPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token } = await params
  const { overdue: overdueParam } = await searchParams
  const overdueOnly = overdueParam === "1"

  const ctx = await validateAccessToken(token)
  if (!ctx) notFound()

  const scope = scopeFromAccessLink(ctx.link)
  const [stats, statuses] = await Promise.all([
    getScopedDashboardStats(scope),
    getWorkflowStatuses(),
  ])

  const flatItems: PublicItem[] = ctx.orders.flatMap((order) =>
    order.items.map((item) => ({
      id: item.id,
      dueAt: item.dueAt.toISOString(),
      measure: {
        name: item.measure.name,
        code: item.measure.code,
        description: item.measure.description,
      },
      status: {
        id: item.status.id,
        name: item.status.name,
        isTerminal: item.status.isTerminal,
      },
      orderTitle: order.title,
      orderIssuedAt: order.issuedAt.toISOString(),
      subdivisionName: item.subdivision?.name ?? null,
    }))
  )

  return (
    <PublicDashboardPage
      token={token}
      organizationName={ctx.organization.name}
      subdivisionName={ctx.subdivision?.name ?? null}
      stats={JSON.parse(JSON.stringify(stats))}
      items={JSON.parse(JSON.stringify(flatItems))}
      statuses={JSON.parse(JSON.stringify(statuses))}
      overdueOnly={overdueOnly}
      scope={scope.type === "subdivision" ? "subdivision" : "organization"}
      showSubdivisionColumn={scope.type === "organization"}
    />
  )
}
