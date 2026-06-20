"use client"

import { Cell, Pie, PieChart } from "recharts"
import type { ColumnFiltersState } from "@tanstack/react-table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DashboardChartLayout,
  PieSliceLabel,
  DashboardChartLegend,
  chartMetrics,
  formatChartLegendLabel,
  hasStatusFilter,
  INACTIVE_OPACITY,
} from "@/components/dashboard/dashboard-chart-shared"
import { MotionFadeIn } from "@/components/motion"
import type { ChartSize } from "@/components/dashboard/chart-category-viewport"
import { cn } from "@/lib/utils"
import { isStatusFilterActive } from "@/lib/dashboard/chart-filters"
import type { StatusDistribution } from "@/lib/dashboard/stats"

export function StatusPieChartSection({
  statusDistribution,
  columnFilters = [],
  onStatusClick,
  size = "card",
}: {
  statusDistribution: StatusDistribution[]
  columnFilters?: ColumnFiltersState
  onStatusClick?: (status: string) => void
  size?: ChartSize
}) {
  const statusChartConfig = statusDistribution.reduce<ChartConfig>((acc, row, i) => {
    acc[row.status] = {
      label: row.status,
      color: row.fill ?? `var(--chart-${(i % 5) + 1})`,
    }
    return acc
  }, { count: { label: "Количество" } })

  const statusFilterActive = hasStatusFilter(columnFilters)
  const statusTotal = statusDistribution.reduce((s, r) => s + r.count, 0)
  const metrics = chartMetrics(size)
  const isCard = size === "card"

  const statusLegendItems = statusDistribution.map((entry) => ({
    key: entry.status,
    label: formatChartLegendLabel(entry.status, entry.count, statusTotal),
    color: entry.fill,
  }))

  const chart = (
    <MotionFadeIn className="h-full w-full">
      <div
        className={cn(
          "relative mx-auto",
          isCard ? "flex h-full w-full items-center justify-center" : "w-full"
        )}
      >
      <div
        className={cn(
          "relative",
          isCard
            ? "aspect-square h-full max-h-full"
            : cn("mx-auto aspect-square w-full", metrics.pieMaxH)
        )}
      >
        <ChartContainer
          config={statusChartConfig}
          className={cn("aspect-square h-full w-full", !isCard && metrics.pieMaxH)}
          initialDimension={
            size === "expanded" ? { width: 480, height: 480 } : undefined
          }
        >
          <PieChart margin={{ top: 12, right: 20, bottom: 12, left: 20 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={statusDistribution}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius={metrics.pieOuterRadius}
              strokeWidth={2}
              className="cursor-pointer"
              label={PieSliceLabel}
              labelLine={false}
              onClick={(_, index) => {
                const entry = statusDistribution[index]
                if (entry && onStatusClick) onStatusClick(entry.status)
              }}
            >
              {statusDistribution.map((entry) => {
                const active = isStatusFilterActive(columnFilters, entry.status)
                const dimmed = statusFilterActive && !active
                return (
                  <Cell
                    key={entry.status}
                    fill={entry.fill}
                    fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                    stroke={active ? "var(--foreground)" : undefined}
                    strokeWidth={active ? 2 : 0}
                  />
                )
              })}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", metrics.pieCenterClass)}>
            {statusTotal}
          </span>
        </div>
      </div>
    </div>
    </MotionFadeIn>
  )

  return (
    <DashboardChartLayout
      size={size}
      chart={chart}
      legend={
        <DashboardChartLegend items={statusLegendItems} onItemClick={onStatusClick} />
      }
    />
  )
}
