import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { SubdivisionDashboardBreadcrumbEffect } from "@/components/platform/dashboard-breadcrumb-effect"
import { ReportScopedShareButton } from "@/components/report/report-scoped-share-button"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganization, getSubdivision } from "@/lib/organizations"
import { getReportShareContext } from "@/lib/report-links/share-context"

export default async function SubdivisionDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; subId: string }>
  searchParams: Promise<{
    overdue?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const session = await requirePageSession()
  const { id, subId } = await params
  const organizationId = Number(id)
  const subdivisionId = Number(subId)
  if (Number.isNaN(organizationId) || Number.isNaN(subdivisionId)) notFound()

  const [org, subdivision, reportShare, bounds, query] = await Promise.all([
    getOrganization(organizationId),
    getSubdivision(subdivisionId),
    getReportShareContext(session, {
      type: "subdivision",
      organizationId,
      subdivisionId,
    }),
    getOrderIssuedAtBounds(),
    searchParams,
  ])
  if (!org || !subdivision || subdivision.organizationId !== organizationId) notFound()

  const { overdueOnly, scope } = resolveDashboardSearch(
    { type: "subdivision", organizationId, subdivisionId },
    query,
    bounds
  )

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "platform",
        scope,
        title: subdivision.name,
        description: `Статусы исполнения мер · ${org.name}`,
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: <>Нет данных по этому подразделению.</>,
        extraActions: (
          <ReportScopedShareButton
            scope={{ type: "subdivision", organizationId, subdivisionId }}
            initialActive={
              reportShare.reportLinkId && reportShare.reportToken
                ? { id: reportShare.reportLinkId, token: reportShare.reportToken }
                : null
            }
            canManage={reportShare.canManageReportLinks}
          />
        ),
        breadcrumbEffect: (
          <SubdivisionDashboardBreadcrumbEffect
            organizationId={organizationId}
            organizationName={org.name}
            subdivisionId={subdivisionId}
            subdivisionName={subdivision.name}
          />
        ),
      })}
    />
  )
}
