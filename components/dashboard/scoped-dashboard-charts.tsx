"use client"

import dynamic from "next/dynamic"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardChartCard } from "@/components/dashboard/dashboard-chart-card"
import { DashboardChartBodySkeleton } from "@/components/dashboard/dashboard-chart-body-skeleton"
import { DashboardChartCardSkeleton } from "@/components/dashboard/dashboard-chart-card-skeleton"
import { ChartsLazyBoundary } from "@/components/dashboard/charts-lazy-boundary"
import { ChartEmptyState } from "@/components/dashboard/dashboard-chart-shared"
import { StatusPieChartSection } from "@/components/dashboard/status-pie-chart-section"
import type {
  BreakdownRow,
  StatusBreakdownRow,
  StatusDistribution,
} from "@/lib/dashboard/stats"
import type {
  ChartFilterScope,
  OverdueChartSegment,
} from "@/lib/dashboard/chart-filters"
import { cn } from "@/lib/utils"

const OverdueBreakdownChartSection = dynamic(
  () =>
    import("@/components/dashboard/overdue-breakdown-chart-section").then(
      (mod) => mod.OverdueBreakdownChartSection
    ),
  { loading: () => <DashboardChartBodySkeleton /> }
)

const CompletionBreakdownChartSection = dynamic(
  () =>
    import("@/components/dashboard/completion-breakdown-chart-section").then(
      (mod) => mod.CompletionBreakdownChartSection
    ),
  { loading: () => <DashboardChartBodySkeleton /> }
)

export function ScopedDashboardCharts({
  scope,
  statusDistribution,
  overdueBreakdown,
  statusBreakdown,
  overdueTitle,
  completionTitle,
  columnFilters = [],
  onStatusClick,
  onOverdueBarClick,
  onOverdueSegmentClick,
  onOverdueLegendClick,
  onStatusBreakdownClick,
  onCompletionLegendClick,
}: {
  scope: ChartFilterScope
  statusDistribution: StatusDistribution[]
  overdueBreakdown: BreakdownRow[]
  statusBreakdown: StatusBreakdownRow[]
  overdueTitle: string
  completionTitle: string
  columnFilters?: ColumnFiltersState
  onStatusClick?: (status: string) => void
  onOverdueBarClick?: (label: string) => void
  onOverdueSegmentClick?: (label: string, segment: OverdueChartSegment) => void
  onOverdueLegendClick?: (segment: OverdueChartSegment) => void
  onStatusBreakdownClick?: (label: string, status: string) => void
  onCompletionLegendClick?: (status: string) => void
}) {
  const barChartProps = {
    scope,
    statusDistribution,
    columnFilters,
    onOverdueBarClick,
    onOverdueSegmentClick,
    onOverdueLegendClick,
    onStatusBreakdownClick,
    onCompletionLegendClick,
  }

  return (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <DashboardChartCard
        className="h-full"
        title="Распределение по статусам"
        expandable={statusDistribution.length > 0}
        renderExpanded={() => (
          <StatusPieChartSection
            statusDistribution={statusDistribution}
            columnFilters={columnFilters}
            onStatusClick={onStatusClick}
            size="expanded"
          />
        )}
      >
        {statusDistribution.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <StatusPieChartSection
            statusDistribution={statusDistribution}
            columnFilters={columnFilters}
            onStatusClick={onStatusClick}
          />
        )}
      </DashboardChartCard>

      <ChartsLazyBoundary fallback={<DashboardChartCardSkeleton className="h-full" />}>
        <DashboardChartCard
          className="h-full"
          title={overdueTitle}
          expandable={overdueBreakdown.length > 0}
          renderExpanded={() => (
            <OverdueBreakdownChartSection
              {...barChartProps}
              overdueBreakdown={overdueBreakdown}
              size="expanded"
            />
          )}
        >
          <OverdueBreakdownChartSection
            {...barChartProps}
            overdueBreakdown={overdueBreakdown}
          />
        </DashboardChartCard>
      </ChartsLazyBoundary>

      <ChartsLazyBoundary
        fallback={
          <DashboardChartCardSkeleton
            className={cn("h-full min-w-0 @2xl/main:col-span-2 @5xl/main:col-span-1")}
          />
        }
      >
        <DashboardChartCard
          className="h-full min-w-0 @2xl/main:col-span-2 @5xl/main:col-span-1"
          title={completionTitle}
          expandable={statusBreakdown.length > 0}
          renderExpanded={() => (
            <CompletionBreakdownChartSection
              {...barChartProps}
              statusBreakdown={statusBreakdown}
              size="expanded"
            />
          )}
        >
          {statusBreakdown.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <CompletionBreakdownChartSection
              {...barChartProps}
              statusBreakdown={statusBreakdown}
            />
          )}
        </DashboardChartCard>
      </ChartsLazyBoundary>
    </div>
  )
}
