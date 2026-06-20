import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { parseDashboardSearchParams } from "@/lib/dashboard/dashboard-query"
import { labels } from "@/lib/ui/branding"
import { validateReportToken } from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string; status?: string; label?: string }>
}) {
  const { token } = await params
  const matrixQuery = parseDashboardSearchParams(await searchParams)

  const ctx = await validateReportToken(token)
  if (!ctx) notFound()

  return (
    <ScopedDashboardPageShell
      variant="report"
      scope={{ type: "global" }}
      matrixQuery={matrixQuery}
      title={`Сводка по ${labels.orgPluralGenitive}`}
      description="Статусы исполнения мер по поручениям"
      baseHref={`/report/${token}`}
      token={token}
      emptyMessage={<>Нет данных для отображения.</>}
    />
  )
}
