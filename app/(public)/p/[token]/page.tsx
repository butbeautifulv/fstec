import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { PublicReportsRevisionBanner } from "@/components/public/public-reports-revision-banner"
import { parseDashboardSearchParams } from "@/lib/dashboard/dashboard-query"
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
  searchParams: Promise<{ overdue?: string; status?: string; label?: string }>
}) {
  const { token } = await params
  const matrixQuery = parseDashboardSearchParams(await searchParams)

  const [linkCtx, statuses, needsRevisionCount] = await Promise.all([
    validateAccessLink(token),
    getWorkflowStatuses(),
    countPublicReportsNeedingRevision(token),
  ])
  if (!linkCtx) notFound()

  const scope = scopeFromAccessLink(linkCtx.link)

  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-6">
      {needsRevisionCount > 0 && (
        <PublicReportsRevisionBanner token={token} count={needsRevisionCount} />
      )}

      <ScopedDashboardPageShell
        variant="public"
        scope={scope}
        matrixQuery={matrixQuery}
        title={linkCtx.organization.name}
        description={
          linkCtx.subdivision?.name
            ? `Подразделение: ${linkCtx.subdivision.name}`
            : "Все меры организации"
        }
        baseHref={`/p/${token}`}
        statuses={serializePublicStatuses(statuses)}
        token={token}
        publicScope={scope.type === "subdivision" ? "subdivision" : "organization"}
        showSubdivisionColumn={scope.type === "organization"}
        emptyMessage="Нет мер для отображения."
      />
    </div>
  )
}
