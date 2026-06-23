import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { OrganizationDashboardBreadcrumbEffect } from "@/components/platform/dashboard-breadcrumb-effect"
import { ReportScopedShareButton } from "@/components/report/report-scoped-share-button"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganization } from "@/lib/organizations"
import { getReportShareContext } from "@/lib/report-links/share-context"

export default async function OrganizationDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    overdue?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const session = await requirePageSession()
  const { id } = await params
  const organizationId = Number(id)
  if (Number.isNaN(organizationId)) notFound()

  const [org, reportShare, bounds, query] = await Promise.all([
    getOrganization(organizationId),
    getReportShareContext(session, { type: "organization", organizationId }),
    getOrderIssuedAtBounds(),
    searchParams,
  ])
  if (!org) notFound()

  const { overdueOnly, scope } = resolveDashboardSearch(
    { type: "organization", organizationId },
    query,
    bounds
  )

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "platform",
        scope,
        title: org.name,
        description: "Статусы исполнения мер по подразделениям",
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: <>Нет данных по этой организации.</>,
        extraActions: (
          <ReportScopedShareButton
            scope={{ type: "organization", organizationId }}
            initialActive={
              reportShare.reportLinkId && reportShare.reportToken
                ? { id: reportShare.reportLinkId, token: reportShare.reportToken }
                : null
            }
            canManage={reportShare.canManageReportLinks}
          />
        ),
        breadcrumbEffect: (
          <OrganizationDashboardBreadcrumbEffect
            organizationId={organizationId}
            organizationName={org.name}
          />
        ),
      })}
    />
  )
}
