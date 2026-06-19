"use client"

import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts"
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
  CompletionRow,
  BreakdownRow,
  StatusDistribution,
} from "@/lib/dashboard/stats"
import {
  isBreakdownFilterActive,
  isCompletionSegmentActive,
  isStatusFilterActive,
  type ChartFilterScope,
} from "@/lib/dashboard/chart-filters"
import { cn } from "@/lib/utils"

const overdueConfig = {
  count: { label: "Просрочено", color: "var(--chart-1)" },
} satisfies ChartConfig

const completionConfig = {
  completed: { label: "Выполнено", color: "var(--chart-2)" },
  active: { label: "В работе", color: "var(--chart-3)" },
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

export function ScopedDashboardCharts({
  scope,
  statusDistribution,
  overdueBreakdown,
  completionBreakdown,
  overdueTitle,
  completionTitle,
  columnFilters = [],
  onStatusClick,
  onOverdueBarClick,
  onCompletionSegmentClick,
}: {
  scope: ChartFilterScope
  statusDistribution: StatusDistribution[]
  overdueBreakdown: BreakdownRow[]
  completionBreakdown: CompletionRow[]
  overdueTitle: string
  completionTitle: string
  columnFilters?: ColumnFiltersState
  onStatusClick?: (status: string) => void
  onOverdueBarClick?: (label: string) => void
  onCompletionSegmentClick?: (label: string, segment: "completed" | "active") => void
}) {
  const statusChartConfig = statusDistribution.reduce<ChartConfig>((acc, row, i) => {
    acc[row.status] = {
      label: row.status,
      color: row.fill ?? `var(--chart-${(i % 5) + 1})`,
    }
    return acc
  }, { count: { label: "Количество" } })

  const statusFilterActive = hasStatusFilter(columnFilters)
  const breakdownFilterActive = hasBreakdownFilter(columnFilters, scope)

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
            <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-64">
              <PieChart>
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
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = statusDistribution.reduce((s, r) => s + r.count, 0)
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan className="fill-foreground text-2xl font-bold">{total}</tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              мер
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="status"
                      className={cn(onStatusClick && "cursor-pointer")}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
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
              <BarChart data={overdueBreakdown} layout="vertical" margin={{ left: 8 }}>
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={4}
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
                </Bar>
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
          {completionBreakdown.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Нет данных
            </div>
          ) : (
            <ChartContainer config={completionConfig} className="aspect-video max-h-64">
              <BarChart data={completionBreakdown}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="completed"
                  stackId="a"
                  fill="var(--color-completed)"
                  radius={[0, 0, 0, 0]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const payload = data as { label?: string }
                    if (payload.label && onCompletionSegmentClick) {
                      onCompletionSegmentClick(payload.label, "completed")
                    }
                  }}
                >
                  {completionBreakdown.map((entry) => {
                    const active = isCompletionSegmentActive(
                      columnFilters,
                      scope,
                      entry.label,
                      "completed"
                    )
                    const dimmed =
                      (breakdownFilterActive || statusFilterActive) && !active
                    return (
                      <Cell
                        key={`${entry.label}-completed`}
                        fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                        stroke={active ? "var(--foreground)" : undefined}
                        strokeWidth={active ? 1 : 0}
                      />
                    )
                  })}
                </Bar>
                <Bar
                  dataKey="active"
                  stackId="a"
                  fill="var(--color-active)"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    const payload = data as { label?: string }
                    if (payload.label && onCompletionSegmentClick) {
                      onCompletionSegmentClick(payload.label, "active")
                    }
                  }}
                >
                  {completionBreakdown.map((entry) => {
                    const active = isCompletionSegmentActive(
                      columnFilters,
                      scope,
                      entry.label,
                      "active"
                    )
                    const dimmed =
                      (breakdownFilterActive || statusFilterActive) && !active
                    return (
                      <Cell
                        key={`${entry.label}-active`}
                        fillOpacity={dimmed ? INACTIVE_OPACITY : 1}
                        stroke={active ? "var(--foreground)" : undefined}
                        strokeWidth={active ? 1 : 0}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
