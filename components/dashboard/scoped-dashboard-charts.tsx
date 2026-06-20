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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  BreakdownRow,
  StatusBreakdownRow,
  StatusDistribution,
} from "@/lib/dashboard/stats"
import {
  isBreakdownFilterActive,
  isStatusFilterActive,
  isStatusSegmentHighlighted,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import { STATUS_DISPLAY_ORDER } from "@/lib/statuses/workflow"

const overdueConfig = {
  count: { label: "Просрочено", color: "var(--chart-1)" },
  remainder: { label: "Остальные", color: "var(--muted)" },
} satisfies ChartConfig

const INACTIVE_OPACITY = 0.35

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

function truncateLabel(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Распределение по статусам</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[280px]">
          {statusDistribution.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Нет данных
            </div>
          ) : (
            <div className="relative mx-auto aspect-square max-h-64 w-full">
              <ChartContainer config={statusChartConfig} className="h-full w-full">
                <PieChart margin={{ bottom: 36 }}>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={48}
                    strokeWidth={2}
                    className="cursor-pointer"
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
                    <LabelList
                      dataKey="count"
                      position="inside"
                      className="fill-background text-[10px] font-medium"
                    />
                  </Pie>
                  <ChartLegend
                    content={
                      <ChartLegendContent
                        nameKey="status"
                        onLegendItemClick={onStatusClick}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ top: "calc(50% - 18px)" }}
              >
                <span className="text-2xl font-bold tabular-nums">{statusTotal}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{overdueTitle}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[280px]">
          {overdueBreakdown.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Нет просроченных
            </div>
          ) : (
            <ChartContainer config={overdueConfig} className="aspect-video max-h-64">
              <BarChart
                data={overdueChartData}
                layout="vertical"
                margin={{ left: 8, right: 48 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "remainder") return null
                        return [value, "Просрочено"]
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  stackId="bullet"
                  fill="var(--color-count)"
                  radius={[4, 0, 0, 4]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const payload = data as { label?: string }
                    if (payload.label && onOverdueBarClick) {
                      onOverdueBarClick(payload.label)
                    }
                  }}
                >
                  {overdueBreakdown.map((entry) => {
                    const active = isBreakdownFilterActive(columnFilters, scope, entry.label)
                    const dimmed = breakdownFilterActive && !active && !hasStatusFilter(columnFilters)
                    return (
                      <Cell
                        key={entry.label}
                        fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                        stroke={active ? "var(--foreground)" : undefined}
                        strokeWidth={active ? 1 : 0}
                      />
                    )
                  })}
                  <LabelList
                    dataKey="count"
                    position="right"
                    content={(props) => {
                      const { x, y, width, height, value, index } = props
                      if (value == null || x == null || y == null) return null
                      const row = overdueChartData[index ?? 0]
                      const total = row?.total ?? 0
                      const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
                      return (
                        <text
                          x={Number(x) + Number(width ?? 0) + 6}
                          y={Number(y) + Number(height ?? 0) / 2}
                          fill="currentColor"
                          className="fill-foreground text-xs font-medium"
                          dominantBaseline="middle"
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
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const payload = data as { label?: string }
                    if (payload.label && onOverdueBarClick) {
                      onOverdueBarClick(payload.label)
                    }
                  }}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">{completionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[280px]">
          {statusBreakdown.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Нет данных
            </div>
          ) : (
            <ChartContainer config={statusBreakdownConfig} className="aspect-video max-h-64">
              <BarChart data={statusBreakdown} margin={{ top: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => {
                    const label = String(payload.value)
                    const active = isBreakdownFilterActive(columnFilters, scope, label)
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={16}
                        textAnchor="middle"
                        className={
                          active
                            ? "cursor-pointer fill-foreground text-xs font-medium"
                            : "cursor-pointer fill-muted-foreground text-xs hover:fill-foreground"
                        }
                        onClick={() => onOverdueBarClick?.(label)}
                      >
                        {truncateLabel(label, 10)}
                      </text>
                    )
                  }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      onLegendItemClick={(status) => onCompletionLegendClick?.(status)}
                    />
                  }
                />
                {STATUS_DISPLAY_ORDER.map((status, index) => {
                  const isLast = index === STATUS_DISPLAY_ORDER.length - 1
                  const isFirst = index === 0
                  return (
                    <Bar
                      key={status}
                      dataKey={status}
                      stackId="status"
                      fill={statusColorMap[status] ?? `var(--chart-${index + 1})`}
                      radius={
                        isLast
                          ? [4, 4, 0, 0]
                          : isFirst
                            ? [0, 0, 0, 0]
                            : [0, 0, 0, 0]
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
                        position="center"
                        className="fill-background text-[10px] font-medium"
                      />
                    </Bar>
                  )
                })}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
