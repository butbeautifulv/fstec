"use client"

import dynamic from "next/dynamic"
import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import {
  overdueInitialFilters,
  toggleBreakdownFilter,
  toggleOverdueLegendFilter,
  toggleOverdueSegmentFilter,
  toggleStatusBreakdownFilter,
  toggleStatusFilter,
  toggleStatusFilterPreserveBreakdown,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import type { PublicItem, PublicStatus } from "@/components/public/public-measures-table"

const ScopedDashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/scoped-dashboard-charts").then(
      (mod) => mod.ScopedDashboardCharts
    ),
  {
    ssr: false,
    loading: () => <DashboardChartsSkeleton />,
  }
)

const PlatformDashboardMatrix = dynamic(
  () =>
    import("@/components/platform/platform-dashboard-matrix").then(
      (mod) => mod.PlatformDashboardMatrix
    ),
  { loading: () => null }
)

const ReportDashboardMatrix = dynamic(
  () =>
    import("@/components/report/report-dashboard-matrix").then(
      (mod) => mod.ReportDashboardMatrix
    ),
  { loading: () => null }
)

const PublicMeasuresTable = dynamic(
  () =>
    import("@/components/public/public-measures-table").then(
      (mod) => mod.PublicMeasuresTable
    ),
  { loading: () => null }
)

import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"

type FilterControl = {
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: Dispatch<SetStateAction<ColumnFiltersState>>
}

type AdminProps = {
  variant: "admin"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
  overdueOnly?: boolean
} & FilterControl

type PublicProps = {
  variant: "public"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn?: boolean
  overdueOnly?: boolean
} & FilterControl

type ReportProps = {
  variant: "report"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  token: string
  items: DashboardMatrixRow[]
  overdueOnly?: boolean
} & FilterControl

export function ScopedDashboardView(props: AdminProps | PublicProps | ReportProps) {
  const initialFilters = useMemo(
    () => (props.overdueOnly ? overdueInitialFilters() : []),
    [props.overdueOnly]
  )
  const [internalFilters, setInternalFilters] =
    useState<ColumnFiltersState>(initialFilters)

  const columnFilters = props.columnFilters ?? internalFilters
  const setColumnFilters = props.onColumnFiltersChange ?? setInternalFilters

  const scope = props.scope

  return (
    <>
      <ScopedDashboardCharts
        scope={scope}
        statusDistribution={props.stats.statusDistribution}
        overdueBreakdown={props.stats.overdueBreakdown}
        statusBreakdown={props.stats.statusBreakdown}
        overdueTitle={props.stats.chartLabels.overdueTitle}
        completionTitle={props.stats.chartLabels.completionTitle}
        columnFilters={columnFilters}
        onStatusClick={(status) =>
          setColumnFilters((prev) => toggleStatusFilter(prev, status))
        }
        onOverdueBarClick={(label) =>
          setColumnFilters((prev) => toggleBreakdownFilter(prev, scope, label))
        }
        onOverdueSegmentClick={(label, segment) =>
          setColumnFilters((prev) =>
            toggleOverdueSegmentFilter(prev, scope, label, segment)
          )
        }
        onOverdueLegendClick={(segment) =>
          setColumnFilters((prev) => toggleOverdueLegendFilter(prev, segment))
        }
        onStatusBreakdownClick={(label, status) =>
          setColumnFilters((prev) =>
            toggleStatusBreakdownFilter(prev, scope, label, status)
          )
        }
        onCompletionLegendClick={(status) =>
          setColumnFilters((prev) =>
            toggleStatusFilterPreserveBreakdown(prev, status)
          )
        }
      />

      {props.variant === "admin" ? (
        <PlatformDashboardMatrix
          items={props.items}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      ) : props.variant === "report" ? (
        <ReportDashboardMatrix
          token={props.token}
          items={props.items}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      ) : (
        <PublicMeasuresTable
          token={props.token}
          items={props.items}
          statuses={props.statuses}
          showSubdivisionColumn={props.showSubdivisionColumn}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      )}
    </>
  )
}
