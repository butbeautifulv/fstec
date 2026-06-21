import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrganization, getSubdivision } from "@/lib/organizations"
import { labels } from "@/lib/ui/branding"
import { validateReportToken } from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token } = await params
  const { overdue: overdueParam } = await searchParams
  const overdueOnly = overdueParam === "1"

  const ctx = await validateReportToken(token)
  if (!ctx) notFound()

  const { scope } = ctx
  let title = `Сводка по ${labels.orgPluralGenitive}`
  let description = "Статусы исполнения мер по поручениям"
  let emptyMessage = <>Нет данных для отображения.</>

  if (scope.type === "organization") {
    const org = await getOrganization(scope.organizationId)
    if (!org) notFound()
    title = org.name
    description = "Статусы исполнения мер по подразделениям"
    emptyMessage = <>Нет данных по этой организации.</>
  } else if (scope.type === "subdivision") {
    const [org, subdivision] = await Promise.all([
      getOrganization(scope.organizationId),
      getSubdivision(scope.subdivisionId),
    ])
    if (!org || !subdivision || subdivision.organizationId !== scope.organizationId) {
      notFound()
    }
    title = subdivision.name
    description = `Статусы исполнения мер · ${org.name}`
    emptyMessage = <>Нет данных по этому подразделению.</>
  }

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "report",
        scope,
        linkScope: scope,
        token,
        title,
        description,
        overdueOnly,
        emptyMessage,
      })}
    />
  )
}
