"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import type { ColumnFiltersState } from "@tanstack/react-table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DashboardChartCard } from "@/components/dashboard/dashboard-chart-card"
import {
  ChartCategoryViewport,
  type ChartSize,
} from "@/components/dashboard/chart-category-viewport"
import { OverflowText } from "@/components/shared/overflow-text"
import { cn } from "@/lib/utils"
import type {
  BreakdownRow,
  StatusBreakdownRow,
  StatusDistribution,
} from "@/lib/dashboard/stats"
import {
  isBreakdownFilterActive,
  isOverdueLegendActive,
  isOverdueSegmentHighlighted,
  isStatusFilterActive,
  isStatusSegmentHighlighted,
  type ChartFilterScope,
  type OverdueChartSegment,
} from "@/lib/dashboard/chart-filters"
import { OVERDUE_LABEL, STATUS_DISPLAY_ORDER } from "@/lib/statuses/workflow"

const INACTIVE_OPACITY = 0.35
const TICK_LINE_HEIGHT = 11
const MIN_SEGMENT_LABEL_PX = 18
const MIN_PIE_INSIDE_PERCENT = 0.08

function chartMetrics(size: ChartSize) {
  if (size === "expanded") {
    return {
      pieMaxH: "max-h-80",
      pieOuterRadius: "72%",
      pieCenterClass: "text-4xl",
      overdueHeight: "h-96",
      overdueInitial: { width: 960, height: 384 },
      completionHeight: "h-96",
      completionInitial: { width: 960, height: 420 },
    }
  }

  return {
    pieMaxH: "max-h-52",
    pieOuterRadius: "68%",
    pieCenterClass: "text-2xl",
    overdueHeight: "h-64",
    overdueInitial: { width: 640, height: 256 },
    completionHeight: "h-64",
    completionInitial: { width: 640, height: 256 },
  }
}

function barChartContainerClassName(layout: { overdueHeight?: string; completionHeight?: string }) {
  const heightClass = layout.overdueHeight ?? layout.completionHeight ?? "h-64"
  return cn(
    "w-full min-w-0 !block !aspect-auto max-h-none [&_.recharts-responsive-container]:!w-full",
    heightClass
  )
}

function ChartEmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      Нет данных
    </div>
  )
}

type PieLabelProps = {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
  value?: number
}

function PieSliceLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
  value = 0,
}: PieLabelProps) {
  if (!value || percent < 0.02) return null

  const RADIAN = Math.PI / 180
  const angle = -midAngle * RADIAN

  if (percent >= MIN_PIE_INSIDE_PERCENT) {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-background text-[10px] font-semibold"
      >
        {value}
      </text>
    )
  }

  const radius = outerRadius + 14
  const x = cx + radius * Math.cos(angle)
  const y = cy + radius * Math.sin(angle)
  const anchor = x > cx ? "start" : "end"
  const lineEnd = outerRadius + 4
  const lineX = cx + lineEnd * Math.cos(angle)
  const lineY = cy + lineEnd * Math.sin(angle)

  return (
    <g>
      <line
        x1={lineX}
        y1={lineY}
        x2={x}
        y2={y}
        className="stroke-muted-foreground"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-semibold"
      >
        {value}
      </text>
    </g>
  )
}

function StackedBarSegmentLabel(props: {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  compact?: boolean
}) {
  const { x, y, width, height, value, compact } = props
  if (value == null || Number(value) === 0) return null

  const barX = Number(x ?? 0)
  const barY = Number(y ?? 0)
  const barW = Number(width ?? 0)
  const barH = Number(height ?? 0)
  const centerX = barX + barW / 2
  const centerY = barY + barH / 2

  if (barH >= MIN_SEGMENT_LABEL_PX) {
    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-background text-[10px] font-semibold"
      >
        {value}
      </text>
    )
  }

  if (compact) return null

  const pillW = 22
  const pillH = 16
  const pillX = barX + barW + 6
  const pillY = centerY - pillH / 2

  return (
    <g>
      <line
        x1={barX + barW}
        y1={centerY}
        x2={pillX}
        y2={centerY}
        className="stroke-border"
        strokeWidth={1}
      />
      <rect
        x={pillX}
        y={pillY}
        width={pillW}
        height={pillH}
        rx={4}
        className="fill-background stroke-border"
        strokeWidth={1}
      />
      <text
        x={pillX + pillW / 2}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-semibold"
      >
        {value}
      </text>
    </g>
  )
}

function DashboardChartLegend({
  items,
  onItemClick,
}: {
  items: { key: string; label: string; color: string; active?: boolean }[]
  onItemClick?: (key: string) => void
}) {
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-x-3 gap-y-2 px-1 pt-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={cn(
            "inline-flex max-w-[calc(50%-0.375rem)] min-w-0 items-start gap-1.5 text-left text-xs sm:max-w-none",
            onItemClick && "cursor-pointer hover:opacity-80",
            item.active ? "font-medium text-foreground" : "text-muted-foreground"
          )}
          onClick={() => onItemClick?.(item.key)}
        >
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          <OverflowText className="min-w-0 flex-1">
            {item.label}
          </OverflowText>
        </button>
      ))}
    </div>
  )
}

function WrappedXAxisTick({
  x = 0,
  y = 0,
  payload,
  maxCharsPerLine,
  maxLines,
  maxTickWidth,
  active,
  onClick,
}: {
  x?: number
  y?: number
  payload?: { value?: string | number }
  maxCharsPerLine: number
  maxLines: number
  maxTickWidth?: number
  active?: boolean
  onClick?: (label: string) => void
}) {
  const label = String(payload?.value ?? "")
  const slotWidth = maxTickWidth ?? Math.max(56, maxCharsPerLine * 7)
  const slotHeight = maxLines * TICK_LINE_HEIGHT + 16

  return (
    <foreignObject
      x={Number(x) - slotWidth / 2}
      y={Number(y)}
      width={slotWidth}
      height={slotHeight}
      className="pointer-events-auto overflow-visible"
    >
      <div
        {...({
          xmlns: "http://www.w3.org/1999/xhtml",
          className: cn(
            "flex h-full w-full items-start justify-center",
            onClick && "cursor-pointer"
          ),
          onClick: () => onClick?.(label),
        } as React.HTMLAttributes<HTMLDivElement> & { xmlns: string })}
      >
        <OverflowText
          className={cn(
            "w-full text-center text-[10px] leading-tight",
            active ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </OverflowText>
      </div>
    </foreignObject>
  )
}

function hasStatusFilter(filters: ColumnFiltersState): boolean {
  return filters.some((f) => f.id === "status")
}

function hasBreakdownFilter(filters: ColumnFiltersState, scope: ChartFilterScope): boolean {
  const columnId =
    scope === "global"
      ? "organization"
      : scope === "organization"
        ? "subdivisionName"
        : "orderTitle"
  return filters.some((f) => f.id === columnId)
}

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
  const statusChartConfig = statusDistribution.reduce<ChartConfig>((acc, row, i) => {
    acc[row.status] = {
      label: row.status,
      color: row.fill ?? `var(--chart-${(i % 5) + 1})`,
    }
    return acc
  }, { count: { label: "Количество" } })

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

  const statusBreakdownConfig = STATUS_DISPLAY_ORDER.reduce<ChartConfig>((acc, status) => {
    acc[status] = {
      label: status,
      color: statusColorMap[status] ?? "var(--chart-1)",
    }
    return acc
  }, {})

  const statusFilterActive = hasStatusFilter(columnFilters)
  const breakdownFilterActive = hasBreakdownFilter(columnFilters, scope)
  const statusTotal = statusDistribution.reduce((s, r) => s + r.count, 0)

  const overdueChartData = overdueBreakdown.map((row) => ({
    ...row,
    remainder: row.total - row.count,
  }))

  const statusLegendItems = statusDistribution.map((entry) => ({
    key: entry.status,
    label: `${entry.status} (${entry.count})`,
    color: entry.fill,
  }))

  const completionStatusTotals = Object.fromEntries(
    STATUS_DISPLAY_ORDER.map((status) => [
      status,
      statusBreakdown.reduce((sum, row) => sum + row[status], 0),
    ])
  ) as Record<(typeof STATUS_DISPLAY_ORDER)[number], number>

  const completionLegendItems = STATUS_DISPLAY_ORDER.map((status) => ({
    key: status,
    label: `${status} (${completionStatusTotals[status]})`,
    color: statusColorMap[status] ?? "var(--chart-1)",
  }))

  const overdueTotal = overdueBreakdown.reduce((sum, row) => sum + row.count, 0)
  const nonOverdueTotal = overdueBreakdown.reduce(
    (sum, row) => sum + row.total - row.count,
    0
  )

  const overdueLegendItems = [
    {
      key: "overdue",
      label: `Просрочено (${overdueTotal})`,
      color: overdueColor,
      active: isOverdueLegendActive(columnFilters, "overdue"),
    },
    {
      key: "nonOverdue",
      label: `Не просрочено (${nonOverdueTotal})`,
      color: "var(--muted)",
      active: isOverdueLegendActive(columnFilters, "nonOverdue"),
    },
  ]

  const overdueChartFilterActive =
    breakdownFilterActive || hasStatusFilter(columnFilters)

  const renderStatusChart = (size: ChartSize) => {
    const metrics = chartMetrics(size)

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative mx-auto aspect-square w-full",
            metrics.pieMaxH
          )}
        >
          <ChartContainer
            config={statusChartConfig}
            className={cn("aspect-square h-full w-full", metrics.pieMaxH)}
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
            <span
              className={cn(
                "font-bold tabular-nums",
                metrics.pieCenterClass
              )}
            >
              {statusTotal}
            </span>
          </div>
        </div>
        <DashboardChartLegend items={statusLegendItems} onItemClick={onStatusClick} />
      </div>
    )
  }

  const renderOverdueChart = (size: ChartSize) => {
    const categoryCount = overdueChartData.length

    return (
      <div className="w-full min-w-0">
        <ChartCategoryViewport categoryCount={categoryCount} size={size}>
          {(layout, chartWidth) => (
            <ChartContainer
              config={overdueChartConfig}
              className={barChartContainerClassName(layout)}
              initialDimension={
                chartWidth
                  ? {
                      width: chartWidth,
                      height: layout.overdueInitial.height,
                    }
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
        <DashboardChartLegend
          items={overdueLegendItems}
          onItemClick={(key) => onOverdueLegendClick?.(key as OverdueChartSegment)}
        />
      </div>
    )
  }

  const renderCompletionChart = (size: ChartSize) => {
    const categoryCount = statusBreakdown.length

    return (
      <div className="w-full min-w-0">
        <ChartCategoryViewport
          categoryCount={categoryCount}
          size={size}
          variant="completion"
          plotAreaInsets={{ left: 52, right: 40 }}
        >
          {(layout, chartWidth) => (
            <ChartContainer
              config={statusBreakdownConfig}
              className={barChartContainerClassName(layout)}
              initialDimension={
                chartWidth
                  ? {
                      width: chartWidth,
                      height: layout.completionInitial.height,
                    }
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
                      radius={
                        isLast ? [4, 4, 0, 0] : isFirst ? [0, 0, 0, 0] : [0, 0, 0, 0]
                      }
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
        <DashboardChartLegend
          items={completionLegendItems}
          onItemClick={onCompletionLegendClick}
        />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <DashboardChartCard
        title="Распределение по статусам"
        expandable={statusDistribution.length > 0}
        renderExpanded={() => renderStatusChart("expanded")}
      >
        {statusDistribution.length === 0 ? (
          <ChartEmptyState />
        ) : (
          renderStatusChart("card")
        )}
      </DashboardChartCard>

      <DashboardChartCard
        title={overdueTitle}
        expandable={overdueBreakdown.length > 0}
        renderExpanded={() => renderOverdueChart("expanded")}
      >
        {overdueBreakdown.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Нет просроченных
          </div>
        ) : (
          renderOverdueChart("card")
        )}
      </DashboardChartCard>

      <DashboardChartCard
        title={completionTitle}
        className="min-w-0 @2xl/main:col-span-2 @5xl/main:col-span-1"
        expandable={statusBreakdown.length > 0}
        renderExpanded={() => renderCompletionChart("expanded")}
      >
        {statusBreakdown.length === 0 ? (
          <ChartEmptyState />
        ) : (
          renderCompletionChart("card")
        )}
      </DashboardChartCard>
    </div>
  )
}
