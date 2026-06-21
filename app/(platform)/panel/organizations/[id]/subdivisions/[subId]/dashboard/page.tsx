import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { SubdivisionDashboardBreadcrumbEffect } from "@/components/platform/dashboard-breadcrumb-effect"
import { ReportScopedShareButton } from "@/components/report/report-scoped-share-button"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganization, getSubdivision } from "@/lib/organizations"
import { getReportShareContext } from "@/lib/report-links/share-context"

export default async function SubdivisionDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; subId: string }>
  searchParams: Promise<{ overdue?: string }>
}) {
  const session = await requirePageSession()
  const { id, subId } = await params
  const organizationId = Number(id)
  const subdivisionId = Number(subId)
  if (Number.isNaN(organizationId) || Number.isNaN(subdivisionId)) notFound()

  const [org, subdivision, reportShare] = await Promise.all([
    getOrganization(organizationId),
    getSubdivision(subdivisionId),
    getReportShareContext(session, {
      type: "subdivision",
      organizationId,
      subdivisionId,
    }),
  ])
  if (!org || !subdivision || subdivision.organizationId !== organizationId) notFound()

  const { overdue } = await searchParams
  const overdueOnly = overdue === "1"

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "platform",
        scope: { type: "subdivision", organizationId, subdivisionId },
        title: subdivision.name,
        description: `Статусы исполнения мер · ${org.name}`,
        overdueOnly,
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
