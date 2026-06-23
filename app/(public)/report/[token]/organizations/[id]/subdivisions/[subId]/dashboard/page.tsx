import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
import { getOrganization, getSubdivision } from "@/lib/organizations"
import {
  assertReportScopeAllowed,
  validateReportToken,
} from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string; id: string; subId: string }> }

export default async function ReportSubdivisionDashboardPage({
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
  const { token, id, subId } = await params
  const organizationId = Number(id)
  const subdivisionId = Number(subId)
  if (!Number.isFinite(organizationId) || !Number.isFinite(subdivisionId)) notFound()

  const requestedScope = {
    type: "subdivision" as const,
    organizationId,
    subdivisionId,
  }

  const query = await searchParams

  const [ctx, org, subdivision, bounds] = await Promise.all([
    validateReportToken(token),
    getOrganization(organizationId),
    getSubdivision(subdivisionId),
    getOrderIssuedAtBounds(),
  ])
  if (
    !ctx ||
    !org ||
    !subdivision ||
    subdivision.organizationId !== organizationId ||
    !assertReportScopeAllowed(ctx, requestedScope)
  ) {
    notFound()
  }

  const { overdueOnly, scope } = resolveDashboardSearch(requestedScope, query, bounds)

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "report",
        scope,
        linkScope: ctx.scope,
        token,
        title: subdivision.name,
        description: `Статусы исполнения мер · ${org.name}`,
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: <>Нет данных по этому подразделению.</>,
      })}
    />
  )
}
