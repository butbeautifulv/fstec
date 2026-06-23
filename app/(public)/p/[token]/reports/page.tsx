import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  DashboardPeriodSection,
  DASHBOARD_PERIOD_LABELS,
} from "@/components/dashboard/dashboard-period-section"
import { PublicReportsPageClient } from "@/components/public/public-reports-page-client"
import { PublicReportsRevisionBanner } from "@/components/public/public-reports-revision-banner"
import { PublicReportsStatusFilters } from "@/components/public/public-reports-status-filters"
import { PublicReportsTable } from "@/components/public/public-reports-table"
import { PageHeader } from "@/components/shared/page-header"
import {
  countPublicReportsNeedingRevision,
  fetchPublicReportItems,
  getPublicReportPeriodBounds,
} from "@/lib/public/reports"
import { parsePeriodFromSearchParams } from "@/lib/dashboard/period-range"
import { serializePublicReportRows } from "@/lib/public/serialize-public"
import { ResponseReviewStatus } from "@prisma/client"

export default async function PublicReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{
    status?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const { token } = await params
  const query = await searchParams

  const statusFilter =
    query.status === ResponseReviewStatus.ACCEPTED ||
    query.status === ResponseReviewStatus.REJECTED ||
    query.status === ResponseReviewStatus.PENDING
      ? (query.status as ResponseReviewStatus)
      : undefined

  const period = parsePeriodFromSearchParams(query)

  const [ctx, needsRevisionCount, bounds] = await Promise.all([
    fetchPublicReportItems(token, statusFilter, period),
    countPublicReportsNeedingRevision(token),
    getPublicReportPeriodBounds(token),
  ])

  if (!ctx || !bounds) notFound()

  const rows = serializePublicReportRows(ctx.rows)
  const description = ctx.subdivision?.name
    ? `Подразделение: ${ctx.subdivision.name}`
    : ctx.organization.name

  return (
    <PublicReportsPageClient>
      <div className="flex min-w-0 flex-col gap-4 md:gap-6">
        <DashboardPeriodSection
          bounds={bounds}
          label={DASHBOARD_PERIOD_LABELS.reports}
        />
        <PageHeader
          title="Отчёты"
          description={description}
          backHref={`/p/${token}`}
          backLabel="Сводка"
          actions={
            <Suspense fallback={null}>
              <PublicReportsStatusFilters token={token} statusFilter={statusFilter} />
            </Suspense>
          }
        />

        {needsRevisionCount > 0 && statusFilter !== ResponseReviewStatus.REJECTED && (
          <PublicReportsRevisionBanner token={token} count={needsRevisionCount} />
        )}

        <PublicReportsTable token={token} rows={rows} />
      </div>
    </PublicReportsPageClient>
  )
}
