"use client"

import dynamic from "next/dynamic"
import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import type { DashboardMatrixLinkTargets } from "@/components/dashboard/dashboard-matrix-table"
import { dashboardMatrixLinkTargets } from "@/lib/dashboard/link-targets"
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
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import {
  getDashboardVariantConfig,
} from "@/lib/dashboard/variant-config"

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

const DashboardMatrixTable = dynamic(
  () =>
    import("@/components/dashboard/dashboard-matrix-table").then(
      (mod) => mod.DashboardMatrixTable
    ),
  { loading: () => null }
)

const MeasuresDataTable = dynamic(
  () =>
    import("@/components/shared/measures-data-table").then(
      (mod) => mod.MeasuresDataTable
    ),
  { loading: () => null }
)

type FilterControl = {
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: Dispatch<SetStateAction<ColumnFiltersState>>
}

type PlatformProps = {
  variant: "platform"
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

export function ScopedDashboardView(props: PlatformProps | PublicProps | ReportProps) {
  const initialFilters = useMemo(
    () => (props.overdueOnly ? overdueInitialFilters() : []),
    [props.overdueOnly]
  )
  const [internalFilters, setInternalFilters] =
    useState<ColumnFiltersState>(initialFilters)

  const columnFilters = props.columnFilters ?? internalFilters
  const setColumnFilters = props.onColumnFiltersChange ?? setInternalFilters

  const scope = props.scope
  const variantConfig = getDashboardVariantConfig(props.variant)

  const matrixLinkTargets: DashboardMatrixLinkTargets | null = useMemo(() => {
    if (variantConfig.tableKind !== "matrix") return null
    return dashboardMatrixLinkTargets(
      props.variant === "platform" ? "platform" : "report",
      props.variant === "report" ? props.token : undefined
    )
  }, [props, variantConfig.tableKind])

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

      {variantConfig.tableKind === "measures" && props.variant === "public" ? (
        <MeasuresDataTable
          basePath={`/p/${props.token}`}
          items={props.items}
          statuses={props.statuses}
          showSubdivisionColumn={props.showSubdivisionColumn}
          actionLabel="Заполнить"
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          pageSize={50}
        />
      ) : matrixLinkTargets && props.variant !== "public" ? (
        <DashboardMatrixTable
          items={props.items}
          linkTargets={matrixLinkTargets}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          pageSize={50}
        />
      ) : null}
    </>
  )
}
