import { notFound } from "next/navigation"
import Link from "next/link"
import { PublicReportsPageClient } from "@/components/public/public-reports-page-client"
import { PublicReportsRevisionBanner } from "@/components/public/public-reports-revision-banner"
import { PublicReportsTable } from "@/components/public/public-reports-table"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  countPublicReportsNeedingRevision,
  fetchPublicReportItems,
} from "@/lib/public/reports"
import { serializePublicReportRows } from "@/lib/public/serialize-public"
import { ResponseReviewStatus } from "@prisma/client"

export default async function PublicReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { token } = await params
  const { status: statusParam } = await searchParams

  const statusFilter =
    statusParam === ResponseReviewStatus.ACCEPTED ||
    statusParam === ResponseReviewStatus.REJECTED ||
    statusParam === ResponseReviewStatus.PENDING
      ? (statusParam as ResponseReviewStatus)
      : undefined

  const [ctx, needsRevisionCount] = await Promise.all([
    fetchPublicReportItems(token, statusFilter),
    countPublicReportsNeedingRevision(token),
  ])

  if (!ctx) notFound()

  const rows = serializePublicReportRows(ctx.rows)
  const description = ctx.subdivision?.name
    ? `Подразделение: ${ctx.subdivision.name}`
    : ctx.organization.name

  const reportsHref = `/p/${token}/reports`

  return (
    <PublicReportsPageClient>
      <div className="flex min-w-0 flex-col gap-4 md:gap-6">
      <PageHeader
        title="Отчёты"
        description={description}
        backHref={`/p/${token}`}
        backLabel="Сводка"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={!statusFilter ? "default" : "outline"} asChild>
              <Link href={reportsHref}>Все</Link>
            </Button>
            <Button
              size="sm"
              variant={
                statusFilter === ResponseReviewStatus.PENDING ? "default" : "outline"
              }
              asChild
            >
              <Link href={`${reportsHref}?status=PENDING`}>На проверке</Link>
            </Button>
            <Button
              size="sm"
              variant={
                statusFilter === ResponseReviewStatus.REJECTED ? "default" : "outline"
              }
              asChild
            >
              <Link href={`${reportsHref}?status=REJECTED`}>Требуют доработки</Link>
            </Button>
            <Button
              size="sm"
              variant={
                statusFilter === ResponseReviewStatus.ACCEPTED ? "default" : "outline"
              }
              asChild
            >
              <Link href={`${reportsHref}?status=ACCEPTED`}>Приняты</Link>
            </Button>
          </div>
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
