"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

const DENSE_CATEGORY_THRESHOLD = 5
const ZOOM_MIN = 100
const ZOOM_MAX_FLOOR = 150
const CHAR_PX = 7
const TICK_SLOT_RATIO = 0.85

export type ChartSize = "card" | "expanded"

export type PlotAreaInsets = { left: number; right: number }

export type BarChartVariant = "default" | "completion"

export type BarChartLayout = ReturnType<typeof chartMetrics> & {
  chartMarginBottom: number
  maxTickWidth?: number
  barCategoryGap: string
  maxBarSize?: number
}

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
      xLabelChars: 14,
      xLabelLines: 3,
      xAxisHeight: 56,
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
    xLabelChars: 9,
    xLabelLines: 2,
    xAxisHeight: 44,
  }
}

function minWidthPerCategory(size: ChartSize) {
  return size === "expanded" ? 108 : 84
}

function maxBarSizeForCategories(size: ChartSize, dense: boolean) {
  if (!dense) return undefined
  return size === "expanded" ? 56 : 48
}

function fallbackContainerWidth(size: ChartSize) {
  return size === "expanded" ? 900 : 640
}

export function categoryBarChartLayout(
  categoryCount: number,
  size: ChartSize,
  containerWidth: number,
  zoom: number,
  plotAreaInsets: PlotAreaInsets = { left: 8, right: 12 },
  variant: BarChartVariant = "default"
): BarChartLayout {
  const base = chartMetrics(size)
  const dense = categoryCount > DENSE_CATEGORY_THRESHOLD
  const barCategoryGap =
    variant === "completion"
      ? dense
        ? "26%"
        : "16%"
      : dense
        ? "15%"
        : "24%"
  const maxBarSize = maxBarSizeForCategories(size, dense)

  if (!dense) {
    return {
      ...base,
      barCategoryGap,
      maxBarSize,
      chartMarginBottom: Math.max(base.xAxisHeight - 8, 8),
    }
  }

  const scaledWidth = containerWidth * (zoom / 100)
  const plotWidth = Math.max(
    scaledWidth - plotAreaInsets.left - plotAreaInsets.right,
    categoryCount * 20
  )
  const perCategory = plotWidth / Math.max(categoryCount, 1)
  const maxTickWidth = Math.floor(perCategory * TICK_SLOT_RATIO)
  const maxChars = size === "expanded" ? 16 : 12
  const xLabelChars = Math.max(3, Math.min(Math.floor(maxTickWidth / CHAR_PX), maxChars))
  const xLabelLines =
    zoom <= ZOOM_MIN || perCategory < 56 ? 1 : size === "expanded" ? 2 : 2
  const xAxisHeight =
    xLabelLines === 1 ? (size === "expanded" ? 44 : 36) : base.xAxisHeight

  return {
    ...base,
    xLabelChars,
    xLabelLines,
    xAxisHeight,
    maxTickWidth,
    barCategoryGap,
    maxBarSize,
    chartMarginBottom: Math.max(xAxisHeight - 4, 12),
  }
}

function ChartRangeControl({
  label,
  value,
  min,
  max,
  step,
  valueLabel,
  onChange,
  compact = false,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueLabel?: string
  onChange: (value: number) => void
  compact?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "min-w-0 flex-1" : "gap-3")}>
      <span
        className={cn(
          "shrink-0 text-xs text-muted-foreground",
          compact ? "w-14" : "w-16"
        )}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
      {valueLabel ? (
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {valueLabel}
        </span>
      ) : (
        <span className="w-10 shrink-0" aria-hidden />
      )}
    </div>
  )
}

export function ChartCategoryViewport({
  categoryCount,
  size,
  plotAreaInsets = { left: 8, right: 12 },
  variant = "default",
  children,
}: {
  categoryCount: number
  size: ChartSize
  plotAreaInsets?: PlotAreaInsets
  variant?: BarChartVariant
  children: (layout: BarChartLayout, chartWidth: number | undefined) => ReactNode
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [userZoom, setUserZoom] = useState<number | null>(null)
  const [panPercent, setPanPercent] = useState(0)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const effectiveWidth = containerWidth || fallbackContainerWidth(size)
  const comfortableWidth = categoryCount * minWidthPerCategory(size)
  const maxZoom = Math.max(
    ZOOM_MIN,
    ZOOM_MAX_FLOOR,
    Math.ceil((comfortableWidth / effectiveWidth) * 100)
  )
  const showControls = categoryCount > DENSE_CATEGORY_THRESHOLD && maxZoom > ZOOM_MIN

  const autoZoom = useMemo(() => {
    if (containerWidth === 0 || categoryCount <= DENSE_CATEGORY_THRESHOLD) return ZOOM_MIN
    const targetZoom = Math.min(maxZoom, Math.ceil((comfortableWidth / containerWidth) * 100))
    return targetZoom > ZOOM_MIN ? targetZoom : ZOOM_MIN
  }, [categoryCount, containerWidth, comfortableWidth, maxZoom])

  const zoom = userZoom ?? autoZoom

  const clampedZoom = Math.min(zoom, maxZoom)
  const chartWidth = Math.round(effectiveWidth * (clampedZoom / 100))
  const maxPan = Math.max(0, chartWidth - effectiveWidth)
  const effectivePanPercent =
    clampedZoom === ZOOM_MIN || maxPan === 0 ? 0 : panPercent
  const panPx = Math.round((effectivePanPercent / 100) * maxPan)
  const needsPan = showControls && clampedZoom > ZOOM_MIN && maxPan > 0

  const layout = categoryBarChartLayout(
    categoryCount,
    size,
    effectiveWidth,
    showControls ? clampedZoom : ZOOM_MIN,
    plotAreaInsets,
    variant
  )

  return (
    <div className="@container/viewport flex w-full flex-col gap-1.5">
      {showControls ? (
        <div
          className={cn(
            "flex flex-col gap-1.5 px-1",
            size === "card" && "@[280px]/viewport:flex-row @[280px]/viewport:flex-wrap @[280px]/viewport:items-center @[280px]/viewport:gap-x-4"
          )}
        >
          <ChartRangeControl
            label="Масштаб"
            value={clampedZoom}
            min={ZOOM_MIN}
            max={maxZoom}
            step={5}
            valueLabel={`${clampedZoom}%`}
            onChange={(value) => {
              setUserZoom(value)
              if (value === ZOOM_MIN) setPanPercent(0)
            }}
            compact={size === "card"}
          />
          {needsPan ? (
            <ChartRangeControl
              label="Позиция"
              value={effectivePanPercent}
              min={0}
              max={100}
              step={1}
              onChange={setPanPercent}
              compact={size === "card"}
            />
          ) : null}
        </div>
      ) : null}
      <div ref={viewportRef} className="w-full overflow-hidden">
        <div
          className={cn(needsPan && "will-change-transform")}
          style={{
            width: showControls ? chartWidth : "100%",
            transform: needsPan ? `translateX(-${panPx}px)` : undefined,
          }}
        >
          {children(layout, showControls ? chartWidth : undefined)}
        </div>
      </div>
    </div>
  )
}
