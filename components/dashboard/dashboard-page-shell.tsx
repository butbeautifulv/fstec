import { Suspense, type ReactNode } from "react"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive"
import { OverdueFilterActions } from "@/components/dashboard/overdue-filter-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import {
  getDashboardVariantConfig,
  type DashboardVariant,
} from "@/lib/dashboard/variant-config"

type BaseShellProps = {
  title: string
  description: string
  baseHref: string
  overdueOnly: boolean
  stats: ScopedDashboardStats
  emptyMessage: ReactNode
  headerActions?: ReactNode
  extraActions?: ReactNode
  suspenseCharts?: boolean
}

type PlatformShellProps = BaseShellProps & {
  variant: "platform"
  scope?: ChartFilterScope
  items: DashboardMatrixRow[]
}

type ReportShellProps = BaseShellProps & {
  variant: "report"
  token: string
  items: DashboardMatrixRow[]
}

type PublicShellProps = BaseShellProps & {
  variant: "public"
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  scope: "organization" | "subdivision"
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
    stats,
    emptyMessage,
    headerActions,
    extraActions,
  } = props

  const config = getDashboardVariantConfig(props.variant)
  const suspenseCharts = props.suspenseCharts ?? config.suspenseChartsDefault

  const interactiveKey = overdueOnly ? "overdue" : "all"
  const interactive =
    props.variant === "platform" ? (
      <DashboardInteractive
        key={interactiveKey}
        variant="platform"
        scope={props.scope ?? config.defaultScope}
        stats={stats}
        items={props.items}
        overdueOnly={overdueOnly}
      />
    ) : props.variant === "report" ? (
      <DashboardInteractive
        key={interactiveKey}
        variant="report"
        scope="global"
        stats={stats}
        token={props.token}
        items={props.items}
        overdueOnly={overdueOnly}
      />
    ) : (
      <DashboardInteractive
        key={interactiveKey}
        variant="public"
        scope={props.scope}
        stats={stats}
        token={props.token}
        items={props.items}
        statuses={props.statuses}
        showSubdivisionColumn={props.showSubdivisionColumn}
        overdueOnly={overdueOnly}
      />
    )

  const showInteractive =
    props.variant === "public" || props.items.length > 0

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

      {props.items.length === 0 && (
        <Alert>
          <AlertDescription>{emptyMessage}</AlertDescription>
        </Alert>
      )}

      {showInteractive &&
        (suspenseCharts ? (
          <Suspense fallback={<DashboardChartsSkeleton />}>{interactive}</Suspense>
        ) : (
          interactive
        ))}
    </div>
  )
}

export type { DashboardMatrixRow, ChartFilterScope, DashboardVariant }
