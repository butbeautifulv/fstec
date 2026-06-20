import { notFound } from "next/navigation"
import { ReportDashboardPage } from "@/components/report/report-dashboard-page"
import { labels } from "@/lib/ui/branding"
import { getCachedScopedDashboard } from "@/lib/dashboard/cache"
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

  const dashboard = await getCachedScopedDashboard({ type: "global" })

  return (
    <ReportDashboardPage
      token={token}
      title={`Сводка по ${labels.orgPluralGenitive}`}
      description="Статусы исполнения мер по поручениям"
      overdueOnly={overdueOnly}
      stats={dashboard.stats}
      items={dashboard.items}
      emptyMessage={<>Нет данных для отображения.</>}
    />
  )
}
