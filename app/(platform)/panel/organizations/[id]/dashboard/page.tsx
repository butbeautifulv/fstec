import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { OrganizationDashboardBreadcrumbEffect } from "@/components/platform/dashboard-breadcrumb-effect"
import { ReportScopedShareButton } from "@/components/report/report-scoped-share-button"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganization } from "@/lib/organizations"
import { getReportShareContext } from "@/lib/report-links/share-context"

export default async function OrganizationDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ overdue?: string }>
}) {
  const session = await requirePageSession()
  const { id } = await params
  const organizationId = Number(id)
  if (Number.isNaN(organizationId)) notFound()

  const [org, reportShare] = await Promise.all([
    getOrganization(organizationId),
    getReportShareContext(session, { type: "organization", organizationId }),
  ])
  if (!org) notFound()

  const { overdue } = await searchParams
  const overdueOnly = overdue === "1"

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "platform",
        scope: { type: "organization", organizationId },
        title: org.name,
        description: "Статусы исполнения мер по подразделениям",
        overdueOnly,
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
