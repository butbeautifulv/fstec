import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { PublicReportsRevisionBanner } from "@/components/public/public-reports-revision-banner"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
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
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token } = await params
  const { overdue: overdueParam } = await searchParams
  const overdueOnly = overdueParam === "1"

  const [linkCtx, statuses, needsRevisionCount] = await Promise.all([
    validateAccessLink(token),
    getWorkflowStatuses(),
    countPublicReportsNeedingRevision(token),
  ])
  if (!linkCtx) notFound()

  const scope = scopeFromAccessLink(linkCtx.link)

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
        emptyMessage: "Нет мер для отображения.",
        beforeContent:
          needsRevisionCount > 0 ? (
            <PublicReportsRevisionBanner token={token} count={needsRevisionCount} />
          ) : undefined,
      })}
    />
  )
}
