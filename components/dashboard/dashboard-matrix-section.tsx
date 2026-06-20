import { Suspense } from "react"
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCachedScopedDashboard } from "@/lib/dashboard/cache"
import {
  dashboardShowsEmptyInteractive,
  toDashboardInteractiveProps,
} from "@/lib/dashboard/interactive-props"
import { mapSerializedMatrixToPublicItems } from "@/lib/public/map-public-items"
import type { PublicStatus } from "@/lib/public/types"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { ScopedDashboardPageShellProps } from "@/components/dashboard/dashboard-page-shell"

type DashboardMatrixSectionProps = ScopedDashboardPageShellProps & {
  scope: DashboardScope
  itemLimit?: number
  publicStatuses?: PublicStatus[]
}

export async function DashboardMatrixSection({
  scope,
  itemLimit,
  publicStatuses,
  overdueOnly,
  emptyMessage,
  suspenseCharts,
  ...shellProps
}: DashboardMatrixSectionProps) {
  const dashboard = await getCachedScopedDashboard(
    scope,
    itemLimit != null ? { limit: itemLimit } : undefined
  )

  const variant = shellProps.variant
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
          statuses: publicStatuses ?? shellProps.statuses,
          scope: shellProps.publicScope,
          showSubdivisionColumn: shellProps.showSubdivisionColumn,
        }
      : variant === "report"
        ? {
            variant: "report" as const,
            token: shellProps.token,
            items: dashboard.items,
          }
        : {
            variant: "platform" as const,
            scope: shellProps.chartScope,
            items: dashboard.items,
          }

  const interactive = (
    <DashboardInteractive
      key={overdueOnly ? "overdue" : "all"}
      {...toDashboardInteractiveProps(
        interactiveShellProps,
        dashboard.stats,
        overdueOnly
      )}
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

      {itemCount > 0 &&
        (suspenseCharts ? (
          <Suspense fallback={<DashboardChartsSkeleton />}>{interactive}</Suspense>
        ) : (
          interactive
        ))}
    </>
  )
}
