import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
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
  searchParams: Promise<{
    overdue?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const { token, id } = await params
  const organizationId = Number(id)
  if (!Number.isFinite(organizationId)) notFound()

  const query = await searchParams
  const baseScope = { type: "organization" as const, organizationId }

  const [ctx, org, bounds] = await Promise.all([
    validateReportToken(token),
    getOrganization(organizationId),
    getOrderIssuedAtBounds(),
  ])
  if (!ctx || !org || !assertReportScopeAllowed(ctx, baseScope)) {
    notFound()
  }

  const { overdueOnly, scope } = resolveDashboardSearch(baseScope, query, bounds)

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "report",
        scope,
        linkScope: ctx.scope,
        token,
        title: org.name,
        description: "Статусы исполнения мер по подразделениям",
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: <>Нет данных по этой организации.</>,
      })}
    />
  )
}
