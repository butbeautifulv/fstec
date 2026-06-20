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
  StackedBarSegmentLabel,
  WrappedXAxisTick,
  barChartContainerClassName,
  formatChartLegendLabel,
  hasBreakdownFilter,
  hasStatusFilter,
  INACTIVE_OPACITY,
} from "@/components/dashboard/dashboard-chart-shared"
import type { StatusBreakdownRow, StatusDistribution } from "@/lib/dashboard/stats"
import {
  isBreakdownFilterActive,
  isStatusSegmentHighlighted,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import { STATUS_DISPLAY_ORDER } from "@/lib/statuses/workflow"

export function CompletionBreakdownChartSection({
  scope,
  statusDistribution,
  statusBreakdown,
  columnFilters = [],
  onOverdueBarClick,
  onStatusBreakdownClick,
  onCompletionLegendClick,
  size = "card",
}: {
  scope: ChartFilterScope
  statusDistribution: StatusDistribution[]
  statusBreakdown: StatusBreakdownRow[]
  columnFilters?: ColumnFiltersState
  onOverdueBarClick?: (label: string) => void
  onStatusBreakdownClick?: (label: string, status: string) => void
  onCompletionLegendClick?: (status: string) => void
  size?: ChartSize
}) {
  const statusColorMap = Object.fromEntries(
    statusDistribution.map((d) => [d.status, d.fill])
  )

  const statusBreakdownConfig = STATUS_DISPLAY_ORDER.reduce<ChartConfig>((acc, status) => {
    acc[status] = {
      label: status,
      color: statusColorMap[status] ?? "var(--chart-1)",
    }
    return acc
  }, {})

  const breakdownFilterActive = hasBreakdownFilter(columnFilters, scope)
  const statusFilterActive = hasStatusFilter(columnFilters)

  const completionStatusTotals = Object.fromEntries(
    STATUS_DISPLAY_ORDER.map((status) => [
      status,
      statusBreakdown.reduce((sum, row) => sum + row[status], 0),
    ])
  ) as Record<(typeof STATUS_DISPLAY_ORDER)[number], number>

  const completionGrandTotal = STATUS_DISPLAY_ORDER.reduce(
    (sum, status) => sum + completionStatusTotals[status],
    0
  )

  const completionLegendItems = STATUS_DISPLAY_ORDER.map((status) => ({
    key: status,
    label: formatChartLegendLabel(
      status,
      completionStatusTotals[status],
      completionGrandTotal
    ),
    color: statusColorMap[status] ?? "var(--chart-1)",
  }))

  const categoryCount = statusBreakdown.length

  const chart = (
    <ChartCategoryViewport
      categoryCount={categoryCount}
      size={size}
      variant="completion"
      plotAreaInsets={{ left: 52, right: 40 }}
    >
      {(layout, chartWidth) => (
        <ChartContainer
          config={statusBreakdownConfig}
          className={barChartContainerClassName(layout, size)}
          initialDimension={
            chartWidth
              ? { width: chartWidth, height: layout.completionInitial.height }
              : layout.completionInitial
          }
        >
          <BarChart
            data={statusBreakdown}
            barCategoryGap={layout.barCategoryGap}
            barGap={categoryCount > 5 ? 1 : 2}
            margin={{
              top: 8,
              right: 40,
              left: 12,
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
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {STATUS_DISPLAY_ORDER.map((status, index) => {
              const isLast = index === STATUS_DISPLAY_ORDER.length - 1
              const isFirst = index === 0
              return (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="status"
                  minPointSize={categoryCount > 5 ? 0 : 8}
                  fill={statusColorMap[status] ?? `var(--chart-${index + 1})`}
                  radius={isLast ? [4, 4, 0, 0] : isFirst ? [0, 0, 0, 0] : [0, 0, 0, 0]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const payload = data as { label?: string }
                    if (payload.label && onStatusBreakdownClick) {
                      onStatusBreakdownClick(payload.label, status)
                    }
                  }}
                >
                  {statusBreakdown.map((entry) => {
                    const highlighted = isStatusSegmentHighlighted(
                      columnFilters,
                      scope,
                      entry.label,
                      status
                    )
                    const dimmed =
                      (breakdownFilterActive || statusFilterActive) && !highlighted
                    return (
                      <Cell
                        key={`${entry.label}-${status}`}
                        fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                        stroke={highlighted ? "var(--foreground)" : undefined}
                        strokeWidth={highlighted ? 1 : 0}
                      />
                    )
                  })}
                  <LabelList
                    dataKey={status}
                    content={
                      ((props: Record<string, unknown>) => (
                        <StackedBarSegmentLabel
                          {...props}
                          compact={categoryCount > 5}
                        />
                      )) as never
                    }
                  />
                </Bar>
              )
            })}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCategoryViewport>
  )

  return (
    <DashboardChartLayout
      size={size}
      chart={chart}
      legend={
        <DashboardChartLegend
          items={completionLegendItems}
          onItemClick={onCompletionLegendClick}
        />
      }
    />
  )
}
