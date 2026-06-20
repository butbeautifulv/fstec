import { Suspense, type ReactNode } from "react"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import { DashboardMatrixSection } from "@/components/dashboard/dashboard-matrix-section"
import { OverdueFilterActions } from "@/components/dashboard/overdue-filter-actions"
import { PageHeader } from "@/components/shared/page-header"
import type { PublicStatus } from "@/lib/public/types"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import type { DashboardVariant } from "@/lib/dashboard/interactive-props"
import { getDashboardVariantConfig } from "@/lib/dashboard/variant-config"

type BaseShellProps = {
  scope: DashboardScope
  title: string
  description: string
  baseHref: string
  overdueOnly: boolean
  emptyMessage: ReactNode
  headerActions?: ReactNode
  extraActions?: ReactNode
  suspenseCharts?: boolean
  itemLimit?: number
}

type PlatformShellProps = BaseShellProps & {
  variant: "platform"
  chartScope?: ChartFilterScope
}

type ReportShellProps = BaseShellProps & {
  variant: "report"
  token: string
}

type PublicShellProps = BaseShellProps & {
  variant: "public"
  token: string
  statuses: PublicStatus[]
  publicScope: "organization" | "subdivision"
  showSubdivisionColumn: boolean
}

export type ScopedDashboardPageShellProps =
  | PlatformShellProps
  | ReportShellProps
  | PublicShellProps

export function ScopedDashboardPageShell(props: ScopedDashboardPageShellProps) {
  const {
    title,
    description,
    baseHref,
    overdueOnly,
    emptyMessage,
    headerActions,
    extraActions,
    scope,
    itemLimit,
  } = props

  const config = getDashboardVariantConfig(props.variant)
  const suspenseCharts = props.suspenseCharts ?? config.suspenseChartsDefault

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {headerActions}
            {extraActions}
            <OverdueFilterActions baseHref={baseHref} overdueOnly={overdueOnly} />
          </div>
        }
      />

      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardMatrixSection
          {...props}
          scope={scope}
          itemLimit={itemLimit}
          overdueOnly={overdueOnly}
          emptyMessage={emptyMessage}
          suspenseCharts={suspenseCharts}
        />
      </Suspense>
    </div>
  )
}

export type { DashboardVariant }
