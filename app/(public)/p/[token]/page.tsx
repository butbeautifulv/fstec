import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { PublicReportsRevisionBanner } from "@/components/public/public-reports-revision-banner"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { countPublicReportsNeedingRevision } from "@/lib/public/reports"
import { serializePublicStatuses } from "@/lib/public/serialize-public"
import { validateAccessLink } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string }> }

export default async function PublicLinkPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{
    overdue?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const { token } = await params
  const query = await searchParams

  const [linkCtx, statuses, needsRevisionCount, bounds] = await Promise.all([
    validateAccessLink(token),
    getWorkflowStatuses(),
    countPublicReportsNeedingRevision(token),
    getOrderIssuedAtBounds(),
  ])
  if (!linkCtx) notFound()

  const baseScope = scopeFromAccessLink(linkCtx.link)
  const { overdueOnly, scope } = resolveDashboardSearch(baseScope, query, bounds)

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "public",
        scope,
        token,
        statuses: serializePublicStatuses(statuses),
        title: linkCtx.organization.name,
        description:
          linkCtx.subdivision?.name
            ? `Подразделение: ${linkCtx.subdivision.name}`
            : "Все меры организации",
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: "Нет мер для отображения.",
        beforeContent:
          needsRevisionCount > 0 ? (
            <PublicReportsRevisionBanner token={token} count={needsRevisionCount} />
          ) : undefined,
      })}
    />
  )
}
