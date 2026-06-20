"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton"
import type { DashboardMatrixLinkTargets } from "@/components/dashboard/dashboard-matrix-table"
import { dashboardMatrixLinkTargets } from "@/lib/dashboard/link-targets"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import {
  buildDashboardHref,
  toggleMatrixBreakdownFilter,
  toggleMatrixOverdueLegendFilter,
  toggleMatrixOverdueSegmentFilter,
  toggleMatrixStatusBreakdownFilter,
  toggleMatrixStatusFilter,
  toggleMatrixStatusFilterPreserveBreakdown,
  type DashboardMatrixQuery,
} from "@/lib/dashboard/dashboard-query"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import { getDashboardVariantConfig } from "@/lib/dashboard/variant-config"

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

type DashboardViewBase = {
  baseHref: string
  matrixQuery: DashboardMatrixQuery
  itemsTruncated?: boolean
  matrixLimit?: number
  columnFilters: ColumnFiltersState
}

type PlatformProps = DashboardViewBase & {
  variant: "platform"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
}

type PublicProps = DashboardViewBase & {
  variant: "public"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn?: boolean
}

type ReportProps = DashboardViewBase & {
  variant: "report"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  token: string
  items: DashboardMatrixRow[]
}

export function ScopedDashboardView(props: PlatformProps | PublicProps | ReportProps) {
  const router = useRouter()
  const { baseHref, matrixQuery, columnFilters } = props
  const scope = props.scope
  const variantConfig = getDashboardVariantConfig(props.variant)

  const matrixLinkTargets: DashboardMatrixLinkTargets | null = useMemo(() => {
    if (variantConfig.tableKind !== "matrix") return null
    return dashboardMatrixLinkTargets(
      props.variant === "platform" ? "platform" : "report",
      props.variant === "report" ? props.token : undefined
    )
  }, [props, variantConfig.tableKind])

  const truncatedHint =
    props.itemsTruncated && props.matrixLimit ? (
      <p className="text-muted-foreground text-sm">
        Показаны первые {props.matrixLimit} мер. Уточните фильтр.
      </p>
    ) : null

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
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixStatusFilter(matrixQuery, status)
            )
          )
        }
        onOverdueBarClick={(label) =>
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixBreakdownFilter(matrixQuery, label)
            )
          )
        }
        onOverdueSegmentClick={(label, segment) =>
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixOverdueSegmentFilter(matrixQuery, label, segment)
            )
          )
        }
        onOverdueLegendClick={(segment) =>
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixOverdueLegendFilter(matrixQuery, segment)
            )
          )
        }
        onStatusBreakdownClick={(label, status) =>
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixStatusBreakdownFilter(matrixQuery, label, status)
            )
          )
        }
        onCompletionLegendClick={(status) =>
          router.push(
            buildDashboardHref(
              baseHref,
              toggleMatrixStatusFilterPreserveBreakdown(matrixQuery, status)
            )
          )
        }
      />

      {variantConfig.tableKind === "measures" && props.variant === "public" ? (
        <>
          <MeasuresDataTable
            basePath={`/p/${props.token}`}
            items={props.items}
            statuses={props.statuses}
            showSubdivisionColumn={props.showSubdivisionColumn}
            actionLabel="Заполнить"
            columnFilters={columnFilters}
            pageSize={50}
          />
          {truncatedHint}
        </>
      ) : matrixLinkTargets && props.variant !== "public" ? (
        <>
          <DashboardMatrixTable
            items={props.items}
            linkTargets={matrixLinkTargets}
            columnFilters={columnFilters}
            pageSize={50}
          />
          {truncatedHint}
        </>
      ) : null}
    </>
  )
}
