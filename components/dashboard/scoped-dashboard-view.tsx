"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { AdminDashboardMatrix } from "@/components/admin/admin-dashboard-matrix"
import { ScopedDashboardCharts } from "@/components/dashboard/scoped-dashboard-charts"
import {
  PublicMeasuresTable,
  type PublicItem,
  type PublicStatus,
} from "@/components/public/public-measures-table"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import {
  overdueInitialFilters,
  toggleBreakdownFilter,
  toggleCompletionSegmentFilter,
  toggleStatusFilter,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"

type MatrixItem = {
  id: number
  orderId: number
  dueAt: string
  isOverdue: boolean
  measure: { id: number; name: string }
  order: { title: string; organization: { id: number; name: string } }
  status: { name: string; isTerminal: boolean }
}

type FilterControl = {
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: Dispatch<SetStateAction<ColumnFiltersState>>
}

type AdminProps = {
  variant: "admin"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: MatrixItem[]
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

export function ScopedDashboardView(props: AdminProps | PublicProps) {
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
        completionBreakdown={props.stats.completionBreakdown}
        overdueTitle={props.stats.chartLabels.overdueTitle}
        completionTitle={props.stats.chartLabels.completionTitle}
        columnFilters={columnFilters}
        onStatusClick={(status) =>
          setColumnFilters((prev) => toggleStatusFilter(prev, status))
        }
        onOverdueBarClick={(label) =>
          setColumnFilters((prev) => toggleBreakdownFilter(prev, scope, label))
        }
        onCompletionSegmentClick={(label, segment) =>
          setColumnFilters((prev) =>
            toggleCompletionSegmentFilter(prev, scope, label, segment)
          )
        }
      />

      {props.variant === "admin" ? (
        <AdminDashboardMatrix
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
