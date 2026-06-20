import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { getCachedScopedDashboard } from "@/lib/dashboard/cache"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { mapSerializedMatrixToPublicItems } from "@/lib/public/map-public-items"
import { serializePublicStatuses } from "@/lib/public/serialize-public"
import { validateAccessLink } from "@/lib/public/validate-token"
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

  const linkCtx = await validateAccessLink(token)
  if (!linkCtx) notFound()

  const scope = scopeFromAccessLink(linkCtx.link)
  const [dashboard, statuses] = await Promise.all([
    getCachedScopedDashboard(scope),
    getWorkflowStatuses(),
  ])

  const flatItems = mapSerializedMatrixToPublicItems(dashboard.items)

  return (
    <ScopedDashboardPageShell
      variant="public"
      title={linkCtx.organization.name}
      description={
        linkCtx.subdivision?.name
          ? `Подразделение: ${linkCtx.subdivision.name}`
          : "Все меры организации"
      }
      baseHref={`/p/${token}`}
      overdueOnly={overdueOnly}
      stats={dashboard.stats}
      items={flatItems}
      statuses={serializePublicStatuses(statuses)}
      token={token}
      scope={scope.type === "subdivision" ? "subdivision" : "organization"}
      showSubdivisionColumn={scope.type === "organization"}
      emptyMessage="Нет мер для отображения."
      suspenseCharts={false}
    />
  )
}
