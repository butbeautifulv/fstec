"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import type { ColumnFiltersState } from "@tanstack/react-table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ChartCategoryViewport,
  type ChartSize,
} from "@/components/dashboard/chart-category-viewport"
import {
  DashboardChartLayout,
  DashboardChartLegend,
  WrappedXAxisTick,
  barChartContainerClassName,
  formatChartLegendLabel,
  hasBreakdownFilter,
  hasStatusFilter,
  INACTIVE_OPACITY,
  CARD_CHART_HEIGHT,
} from "@/components/dashboard/dashboard-chart-shared"
import { MotionFadeIn } from "@/components/motion"
import { cn } from "@/lib/utils"
import type { BreakdownRow, StatusDistribution } from "@/lib/dashboard/stats"
import {
  isBreakdownFilterActive,
  isOverdueLegendActive,
  isOverdueSegmentHighlighted,
  type ChartFilterScope,
  type OverdueChartSegment,
} from "@/lib/dashboard/chart-filters"
import { OVERDUE_LABEL } from "@/lib/statuses/workflow"

export function OverdueBreakdownChartSection({
  scope,
  statusDistribution,
  overdueBreakdown,
  columnFilters = [],
  onOverdueBarClick,
  onOverdueSegmentClick,
  onOverdueLegendClick,
  size = "card",
}: {
  scope: ChartFilterScope
  statusDistribution: StatusDistribution[]
  overdueBreakdown: BreakdownRow[]
  columnFilters?: ColumnFiltersState
  onOverdueBarClick?: (label: string) => void
  onOverdueSegmentClick?: (label: string, segment: OverdueChartSegment) => void
  onOverdueLegendClick?: (segment: OverdueChartSegment) => void
  size?: ChartSize
}) {
  const statusColorMap = Object.fromEntries(
    statusDistribution.map((d) => [d.status, d.fill])
  )
  const overdueColor =
    statusColorMap[OVERDUE_LABEL] ??
    statusDistribution.find((d) => d.status === OVERDUE_LABEL)?.fill ??
    "var(--chart-4)"

  const overdueChartConfig = {
    count: { label: "Просрочено", color: overdueColor },
    remainder: { label: "Не просрочено", color: "var(--muted)" },
  } satisfies ChartConfig

  const breakdownFilterActive = hasBreakdownFilter(columnFilters, scope)
  const overdueChartFilterActive =
    breakdownFilterActive || hasStatusFilter(columnFilters)

  const overdueChartData = overdueBreakdown.map((row) => ({
    ...row,
    remainder: row.total - row.count,
  }))

  const overdueTotal = overdueBreakdown.reduce((sum, row) => sum + row.count, 0)
  const nonOverdueTotal = overdueBreakdown.reduce(
    (sum, row) => sum + row.total - row.count,
    0
  )
  const overdueLegendTotal = overdueTotal + nonOverdueTotal

  const overdueLegendItems = [
    {
      key: "overdue",
      label: formatChartLegendLabel("Просрочено", overdueTotal, overdueLegendTotal),
      color: overdueColor,
      active: isOverdueLegendActive(columnFilters, "overdue"),
    },
    {
      key: "nonOverdue",
      label: formatChartLegendLabel("Не просрочено", nonOverdueTotal, overdueLegendTotal),
      color: "var(--muted)",
      active: isOverdueLegendActive(columnFilters, "nonOverdue"),
    },
  ]

  const chart = (
    <ChartCategoryViewport categoryCount={overdueChartData.length} size={size}>
      {(layout, chartWidth) => (
        <ChartContainer
          config={overdueChartConfig}
          className={barChartContainerClassName(layout, size)}
          initialDimension={
            chartWidth
              ? { width: chartWidth, height: layout.overdueInitial.height }
              : layout.overdueInitial
          }
        >
          <BarChart
            data={overdueChartData}
            barCategoryGap={layout.barCategoryGap}
            margin={{
              top: 8,
              right: 12,
              left: 8,
              bottom: layout.chartMarginBottom,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={layout.xAxisHeight}
              tick={({ x, y, payload }) => (
                <WrappedXAxisTick
                  x={Number(x)}
                  y={Number(y)}
                  payload={payload}
                  maxCharsPerLine={layout.xLabelChars}
                  maxLines={layout.xLabelLines}
                  maxTickWidth={layout.maxTickWidth}
                  active={isBreakdownFilterActive(
                    columnFilters,
                    scope,
                    String(payload?.value ?? "")
                  )}
                  onClick={onOverdueBarClick}
                />
              )}
            />
            <YAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              stackId="bullet"
              fill={overdueColor}
              radius={[0, 0, 4, 4]}
              className="cursor-pointer"
              onClick={(data) => {
                const payload = data as { label?: string }
                if (payload.label && onOverdueSegmentClick) {
                  onOverdueSegmentClick(payload.label, "overdue")
                }
              }}
            >
              {overdueBreakdown.map((entry) => {
                const highlighted = isOverdueSegmentHighlighted(
                  columnFilters,
                  scope,
                  entry.label,
                  "overdue"
                )
                const dimmed = overdueChartFilterActive && !highlighted
                return (
                  <Cell
                    key={entry.label}
                    fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                    stroke={highlighted ? "var(--foreground)" : undefined}
                    strokeWidth={highlighted ? 1 : 0}
                  />
                )
              })}
              <LabelList
                dataKey="count"
                position="top"
                content={(props) => {
                  const { x, y, width, value, index } = props
                  if (value == null || x == null || y == null) return null
                  const row = overdueChartData[index ?? 0]
                  const total = row?.total ?? 0
                  const pct =
                    total > 0 ? Math.round((Number(value) / total) * 100) : 0
                  return (
                    <text
                      x={Number(x) + Number(width ?? 0) / 2}
                      y={Number(y) - 6}
                      textAnchor="middle"
                      className="fill-foreground text-xs font-medium"
                      dominantBaseline="auto"
                    >
                      {`${value} · ${pct}%`}
                    </text>
                  )
                }}
              />
            </Bar>
            <Bar
              dataKey="remainder"
              stackId="bullet"
              fill="var(--color-remainder)"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(data) => {
                const payload = data as { label?: string }
                if (payload.label && onOverdueSegmentClick) {
                  onOverdueSegmentClick(payload.label, "nonOverdue")
                }
              }}
            >
              {overdueBreakdown.map((entry) => {
                const highlighted = isOverdueSegmentHighlighted(
                  columnFilters,
                  scope,
                  entry.label,
                  "nonOverdue"
                )
                const dimmed = overdueChartFilterActive && !highlighted
                return (
                  <Cell
                    key={`${entry.label}-remainder`}
                    fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                    stroke={highlighted ? "var(--foreground)" : undefined}
                    strokeWidth={highlighted ? 1 : 0}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCategoryViewport>
  )

  if (overdueBreakdown.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground",
          CARD_CHART_HEIGHT
        )}
      >
        Нет просроченных
      </div>
    )
  }

  return (
    <MotionFadeIn className="h-full">
      <DashboardChartLayout
        size={size}
        chart={chart}
        legend={
          <DashboardChartLegend
            items={overdueLegendItems}
            onItemClick={(key) => onOverdueLegendClick?.(key as OverdueChartSegment)}
          />
        }
      />
    </MotionFadeIn>
  )
}
