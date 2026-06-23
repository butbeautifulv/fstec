import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { ReportShareButton } from "@/components/report/report-share-button"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { getOrderIssuedAtBounds } from "@/lib/dashboard/period-bounds"
import { resolveDashboardSearch } from "@/lib/dashboard/resolve-dashboard-search"
import { Permission, hasPermission } from "@/lib/auth/permissions"
import { requirePageSession } from "@/lib/auth/page-guard"
import { labels } from "@/lib/ui/branding"
import { getActiveReportLink } from "@/lib/report-links"

export default async function PlatformDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    overdue?: string
    from?: string
    to?: string
    period?: string
  }>
}) {
  const params = await searchParams
  const session = await requirePageSession()
  const canManageReportLinks = hasPermission(session.role, Permission.settingsWrite)

  const [bounds, activeReportLink] = await Promise.all([
    getOrderIssuedAtBounds(),
    canManageReportLinks
      ? getActiveReportLink({ type: "global" })
      : Promise.resolve(null),
  ])

  const { overdueOnly, scope } = resolveDashboardSearch({ type: "global" }, params, bounds)

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "platform",
        scope,
        title: `Сводка по ${labels.orgPluralGenitive}`,
        description: "Статусы исполнения мер по поручениям",
        overdueOnly,
        periodBounds: bounds,
        emptyMessage: (
          <>Нет данных. Создайте поручение для {labels.orgGenitive} в разделе «Поручения».</>
        ),
        extraActions:
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
          ) : undefined,
      })}
    />
  )
}
