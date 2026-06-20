import { Suspense } from "react"
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getCachedScopedDashboardStats,
  getScopedDashboardItems,
} from "@/lib/dashboard/cache"
import {
  statsItemTotal,
  type DashboardMatrixQuery,
} from "@/lib/dashboard/dashboard-query"
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
  matrixQuery: DashboardMatrixQuery
  publicStatuses?: PublicStatus[]
}

export async function DashboardMatrixSection({
  scope,
  matrixQuery,
  publicStatuses,
  baseHref,
  emptyMessage,
  suspenseCharts,
  ...shellProps
}: DashboardMatrixSectionProps) {
  const [stats, matrix] = await Promise.all([
    getCachedScopedDashboardStats(scope),
    getScopedDashboardItems(scope, matrixQuery),
  ])

  const variant = shellProps.variant
  const statsTotal = statsItemTotal(stats)
  const itemCount =
    variant === "public"
      ? mapSerializedMatrixToPublicItems(matrix.items).length
      : matrix.items.length

  const interactiveShellProps =
    variant === "public"
      ? {
          variant: "public" as const,
          token: shellProps.token,
          items: mapSerializedMatrixToPublicItems(matrix.items),
          statuses: publicStatuses ?? shellProps.statuses,
          scope: shellProps.publicScope,
          showSubdivisionColumn: shellProps.showSubdivisionColumn,
        }
      : variant === "report"
        ? {
            variant: "report" as const,
            token: shellProps.token,
            items: matrix.items,
          }
        : {
            variant: "platform" as const,
            scope: shellProps.chartScope,
            items: matrix.items,
          }

  const filterKey = [
    matrixQuery.overdueOnly ? "overdue" : "all",
    matrixQuery.breakdownLabel ?? "",
    matrixQuery.displayStatuses?.join(",") ?? "",
  ].join(":")

  const interactive = (
    <DashboardInteractive
      key={filterKey}
      {...toDashboardInteractiveProps(interactiveShellProps, stats, {
        baseHref,
        matrixQuery,
        itemsTruncated: matrix.truncated,
        matrixLimit: matrix.limit,
      })}
    />
  )

  if (!dashboardShowsEmptyInteractive(variant, itemCount, statsTotal)) {
    return null
  }

  const scopeEmpty = statsTotal === 0 && itemCount === 0

  return (
    <>
      {scopeEmpty ? (
        <Alert>
          <AlertDescription>{emptyMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!scopeEmpty &&
        (suspenseCharts ? (
          <Suspense fallback={<DashboardChartsSkeleton />}>{interactive}</Suspense>
        ) : (
          interactive
        ))}
    </>
  )
}
