import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
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

  return (
    <ScopedDashboardPageShell
      variant="report"
      scope={{ type: "global" }}
      title={`Сводка по ${labels.orgPluralGenitive}`}
      description="Статусы исполнения мер по поручениям"
      baseHref={`/report/${token}`}
      overdueOnly={overdueOnly}
      token={token}
      emptyMessage={<>Нет данных для отображения.</>}
    />
  )
}
