"use client"

import type { ColumnFiltersState } from "@tanstack/react-table"
import { OverflowText } from "@/components/shared/overflow-text"
import {
  DASHBOARD_CARD_CHART_HEIGHT_CLASS,
  DASHBOARD_CARD_LEGEND_HEIGHT_CLASS,
} from "@/components/dashboard/chart-card-layout"
import type { ChartSize } from "@/components/dashboard/chart-category-viewport"
import { cn } from "@/lib/utils"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"

export const INACTIVE_OPACITY = 0.35
export const TICK_LINE_HEIGHT = 11
export const MIN_SEGMENT_LABEL_PX = 18
export const MIN_PIE_INSIDE_PERCENT = 0.08
export const CARD_CHART_HEIGHT = DASHBOARD_CARD_CHART_HEIGHT_CLASS
export const CARD_LEGEND_HEIGHT = DASHBOARD_CARD_LEGEND_HEIGHT_CLASS

export function formatChartLegendLabel(label: string, count: number, total: number) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return `${label} (${count}) ${pct}%`
}

export function DashboardChartLayout({
  size,
  chart,
  legend,
}: {
  size: ChartSize
  chart: React.ReactNode
  legend: React.ReactNode
}) {
  if (size === "expanded") {
    return (
      <div className="w-full min-w-0">
        {chart}
        {legend}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn("shrink-0 overflow-hidden", CARD_CHART_HEIGHT)}>{chart}</div>
      <div className={cn("shrink-0", CARD_LEGEND_HEIGHT)}>{legend}</div>
    </div>
  )
}

export function chartMetrics(size: ChartSize) {
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
    overdueInitial: { width: 640, height: 288 },
    completionHeight: "h-64",
    completionInitial: { width: 640, height: 288 },
  }
}

export function barChartContainerClassName(
  layout: { overdueHeight?: string; completionHeight?: string },
  size: ChartSize
) {
  const heightClass =
    size === "card"
      ? DASHBOARD_CARD_CHART_HEIGHT_CLASS
      : layout.overdueHeight ?? layout.completionHeight ?? "h-64"
  return cn(
    "w-full min-w-0 !block !aspect-auto max-h-none [&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:!w-full",
    heightClass
  )
}

export function ChartEmptyState() {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-sm text-muted-foreground",
        CARD_CHART_HEIGHT
      )}
    >
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

export function PieSliceLabel({
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

const MIN_OVERDUE_LABEL_BAR_WIDTH = 28
const MIN_OVERDUE_FULL_LABEL_BAR_WIDTH = 44

export function OverdueCountLabel(props: {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  total?: number
  compact?: boolean
}) {
  const { x, y, width, height, value, total, compact } = props
  if (value == null || Number(value) === 0) return null

  const barX = Number(x ?? 0)
  const barY = Number(y ?? 0)
  const barW = Number(width ?? 0)
  const barH = Number(height ?? 0)
  const numValue = Number(value)
  const pct = total != null && total > 0 ? Math.round((numValue / total) * 100) : 0
  const minWidth = compact ? MIN_OVERDUE_LABEL_BAR_WIDTH : MIN_OVERDUE_FULL_LABEL_BAR_WIDTH

  if (barW < minWidth) return null

  const label = compact ? `${pct}%` : `${numValue} · ${pct}%`

  if (barH >= MIN_SEGMENT_LABEL_PX) {
    return (
      <text
        x={barX + barW / 2}
        y={barY + barH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-background text-[10px] font-semibold"
      >
        {label}
      </text>
    )
  }

  if (compact) return null

  return (
    <text
      x={barX + barW / 2}
      y={barY - 6}
      textAnchor="middle"
      dominantBaseline="auto"
      className="fill-foreground text-xs font-medium"
    >
      {label}
    </text>
  )
}

export function StackedBarSegmentLabel(props: {
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

export function DashboardChartLegend({
  items,
  onItemClick,
}: {
  items: { key: string; label: string; color: string; active?: boolean }[]
  onItemClick?: (key: string) => void
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-t pt-2">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "inline-flex min-w-0 items-start gap-1.5 text-left text-[11px] leading-tight",
                onItemClick && "cursor-pointer hover:opacity-80",
                item.active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
              onClick={() => onItemClick?.(item.key)}
            >
              <span
                className="mt-0.5 h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <OverflowText className="min-w-0 flex-1">{item.label}</OverflowText>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function WrappedXAxisTick({
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

export function hasStatusFilter(filters: ColumnFiltersState): boolean {
  return filters.some((f) => f.id === "status")
}

export function hasBreakdownFilter(filters: ColumnFiltersState, scope: ChartFilterScope): boolean {
  const columnId =
    scope === "global"
      ? "organization"
      : scope === "organization"
        ? "subdivisionName"
        : "orderTitle"
  return filters.some((f) => f.id === columnId)
}
