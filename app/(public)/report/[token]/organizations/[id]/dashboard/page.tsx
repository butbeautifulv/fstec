import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrganization } from "@/lib/organizations"
import {
  assertReportScopeAllowed,
  validateReportToken,
} from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function ReportOrganizationDashboardPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token, id } = await params
  const organizationId = Number(id)
  if (!Number.isFinite(organizationId)) notFound()

  const [ctx, org] = await Promise.all([
    validateReportToken(token),
    getOrganization(organizationId),
  ])
  if (
    !ctx ||
    !org ||
    !assertReportScopeAllowed(ctx, { type: "organization", organizationId })
  ) {
    notFound()
  }

  const { overdue } = await searchParams
  const overdueOnly = overdue === "1"

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "report",
        scope: { type: "organization", organizationId },
        linkScope: ctx.scope,
        token,
        title: org.name,
        description: "Статусы исполнения мер по подразделениям",
        overdueOnly,
        emptyMessage: <>Нет данных по этой организации.</>,
      })}
    />
  )
}
