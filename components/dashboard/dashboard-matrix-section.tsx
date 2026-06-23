import { Suspense } from "react"
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCachedScopedDashboard } from "@/lib/dashboard/cache"
import {
  chartScopeFromDashboardScope,
  publicShowsSubdivisionColumn,
} from "@/lib/dashboard/chart-scope"
import {
  dashboardShowsEmptyInteractive,
  toDashboardInteractiveProps,
} from "@/lib/dashboard/interactive-props"
import { mapSerializedMatrixToPublicItems } from "@/lib/public/map-public-items"
import type { PeriodBounds } from "@/lib/dashboard/period-range"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { ScopedDashboardPageShellProps } from "@/components/dashboard/dashboard-page-shell"

type DashboardMatrixSectionProps = ScopedDashboardPageShellProps & {
  scope: DashboardScope
  itemLimit?: number
  periodBounds?: PeriodBounds
}

export async function DashboardMatrixSection({
  scope,
  itemLimit,
  overdueOnly,
  emptyMessage,
  suspenseCharts,
  periodBounds,
  ...shellProps
}: DashboardMatrixSectionProps) {
  const dashboard = await getCachedScopedDashboard(
    scope,
    itemLimit != null ? { limit: itemLimit } : undefined
  )

  const variant = shellProps.variant
  const chartScope = chartScopeFromDashboardScope(scope)
  const itemCount =
    variant === "public"
      ? mapSerializedMatrixToPublicItems(dashboard.items).length
      : dashboard.items.length

  const interactiveShellProps =
    variant === "public"
      ? {
          variant: "public" as const,
          token: shellProps.token,
          items: mapSerializedMatrixToPublicItems(dashboard.items),
          statuses: shellProps.statuses,
          scope: chartScope,
          showSubdivisionColumn: publicShowsSubdivisionColumn(scope),
          dashboardScope: scope,
        }
      : variant === "report"
        ? {
            variant: "report" as const,
            token: shellProps.token,
            linkScope: shellProps.linkScope,
            scope: chartScope,
            items: dashboard.items,
            dashboardScope: scope,
          }
        : {
            variant: "platform" as const,
            scope: chartScope,
            items: dashboard.items,
            dashboardScope: scope,
          }

  const interactive = (
    <DashboardInteractive
      key={overdueOnly ? "overdue" : "all"}
      {...toDashboardInteractiveProps(
        interactiveShellProps,
        dashboard.stats,
        overdueOnly
      )}
      dashboardScope={scope}
      showStatCards={itemCount > 0}
      showCharts={itemCount > 0}
      showMatrix={itemCount > 0}
      periodBounds={periodBounds}
    />
  )

  if (!dashboardShowsEmptyInteractive(variant, itemCount)) {
    return null
  }

  return (
    <>
      {itemCount === 0 ? (
        <Alert>
          <AlertDescription>{emptyMessage}</AlertDescription>
        </Alert>
      ) : null}

      {suspenseCharts ? (
        <Suspense fallback={<DashboardChartsSkeleton />}>{interactive}</Suspense>
      ) : (
        interactive
      )}
    </>
  )
}
