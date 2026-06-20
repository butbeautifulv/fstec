import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { ReportShareButton } from "@/components/report/report-share-button"
import { Permission, hasPermission } from "@/lib/auth/permissions"
import { requirePageSession } from "@/lib/auth/page-guard"
import { labels } from "@/lib/ui/branding"
import { getCachedScopedDashboard } from "@/lib/dashboard/cache"
import { getActiveReportLink } from "@/lib/report-links"

export default async function PlatformDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>
}) {
  const params = await searchParams
  const overdueOnly = params.overdue === "1"
  const session = await requirePageSession()
  const canManageReportLinks = hasPermission(session.role, Permission.settingsWrite)

  const [dashboard, activeReportLink] = await Promise.all([
    getCachedScopedDashboard({ type: "global" }),
    canManageReportLinks ? getActiveReportLink() : Promise.resolve(null),
  ])

  return (
    <ScopedDashboardPageShell
      variant="admin"
      title={`Сводка по ${labels.orgPluralGenitive}`}
      description="Статусы исполнения мер по поручениям"
      baseHref="/panel"
      overdueOnly={overdueOnly}
      stats={dashboard.stats}
      items={dashboard.items}
      emptyMessage={
        <>Нет данных. Создайте поручение для {labels.orgGenitive} в разделе «Поручения».</>
      }
      extraActions={
        canManageReportLinks ? (
          <ReportShareButton
            initialActive={
              activeReportLink
                ? {
                    id: activeReportLink.id,
                    token: activeReportLink.token,
                    revokedAt: activeReportLink.revokedAt?.toISOString() ?? null,
                  }
                : null
            }
          />
        ) : undefined
      }
    />
  )
}
