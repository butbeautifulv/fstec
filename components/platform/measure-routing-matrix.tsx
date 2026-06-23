"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { targetKey, type SelectableBatchTargetRow } from "@/lib/orders/batch-targets"

export type RoutingMeasure = {
  id: number
  name: string
  code: string | null
}

export type TargetMeasureSelection = Map<string, Set<number>>

export type RoutingSuggestionRow = {
  importItemId: number
  measureId: number | null
  code: string | null
  suggestions: Array<{
    subdivisionId: number | null
    subdivisionName: string
    confidence: number
    reason?: string
  }>
}

export function buildSelectionFromSuggestions(
  targets: SelectableBatchTargetRow[],
  measures: RoutingMeasure[],
  suggestions: RoutingSuggestionRow[]
): TargetMeasureSelection {
  const selection: TargetMeasureSelection = new Map()
  const measureIds = measures.map((m) => m.id)

  for (const target of targets) {
    const key = targetKey(target)
    const assigned = new Set<number>()

    for (const measure of measures) {
      const row = suggestions.find(
        (s) =>
          s.measureId === measure.id ||
          (s.code != null && s.code === measure.code)
      )
      const top = row?.suggestions[0]
      if (!top) {
        assigned.add(measure.id)
        continue
      }
      if (target.subdivisionId == null) {
        assigned.add(measure.id)
        continue
      }
      if (top.subdivisionId === target.subdivisionId) {
        assigned.add(measure.id)
        continue
      }
      if (top.confidence < 0.35) {
        assigned.add(measure.id)
      }
    }

    selection.set(key, assigned.size > 0 ? assigned : new Set(measureIds))
  }

  return selection
}

function findSuggestionForCell(
  measure: RoutingMeasure,
  target: SelectableBatchTargetRow,
  suggestions: RoutingSuggestionRow[]
) {
  const row = suggestions.find(
    (s) =>
      s.measureId === measure.id || (s.code != null && s.code === measure.code)
  )
  if (!row || target.subdivisionId == null) return null
  return (
    row.suggestions.find((s) => s.subdivisionId === target.subdivisionId) ??
    row.suggestions[0] ??
    null
  )
}

export function MeasureRoutingMatrix({
  targets,
  measures,
  selection,
  suggestions = [],
  onSelectionChange,
  title = "МАШ — маршрутизация по подразделениям",
}: {
  targets: SelectableBatchTargetRow[]
  measures: RoutingMeasure[]
  selection: TargetMeasureSelection
  suggestions?: RoutingSuggestionRow[]
  onSelectionChange: (next: TargetMeasureSelection) => void
  title?: string
}) {
  const visibleTargets = useMemo(
    () => targets.filter((t) => t.subdivisionId != null),
    [targets]
  )

  if (visibleTargets.length === 0 || measures.length === 0) return null

  function toggle(target: SelectableBatchTargetRow, measureId: number, checked: boolean) {
    const key = targetKey(target)
    const next = new Map(selection)
    const set = new Set(next.get(key) ?? [])
    if (checked) set.add(measureId)
    else set.delete(measureId)
    next.set(key, set)
    onSelectionChange(next)
  }

  function acceptAllForTarget(target: SelectableBatchTargetRow) {
    const key = targetKey(target)
    const next = new Map(selection)
    next.set(key, new Set(measures.map((m) => m.id)))
    onSelectionChange(next)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 overflow-x-auto">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          Вероятности маршрутизации — можно скорректировать вручную
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">Подразделение</TableHead>
              {measures.map((m) => (
                <TableHead key={m.id} className="min-w-28 text-xs font-normal">
                  {m.code ?? m.name.slice(0, 12)}
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTargets.map((target) => {
              const key = targetKey(target)
              const selected = selection.get(key) ?? new Set()
              return (
                <TableRow key={key}>
                  <TableCell className="text-sm">
                    {target.subdivisionName}
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {target.organizationName}
                    </Badge>
                  </TableCell>
                  {measures.map((m) => {
                    const suggestion = findSuggestionForCell(m, target, suggestions)
                    const confidence = suggestion?.confidence
                    const isMatch = suggestion?.subdivisionId === target.subdivisionId
                    const lowConfidence =
                      confidence != null && confidence < 0.35 && !isMatch

                    return (
                      <TableCell key={m.id} className="text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={selected.has(m.id)}
                            onCheckedChange={(v) => toggle(target, m.id, v === true)}
                          />
                          {confidence != null && isMatch ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={lowConfidence ? "outline" : "secondary"}
                                  className="text-[10px] font-normal"
                                >
                                  {Math.round(confidence * 100)}%
                                </Badge>
                              </TooltipTrigger>
                              {suggestion?.reason ? (
                                <TooltipContent>{suggestion.reason}</TooltipContent>
                              ) : null}
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>
                    )
                  })}
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => acceptAllForTarget(target)}
                    >
                      Все
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

export function DzoTargetsSummary({
  targets,
  measures,
  selection,
}: {
  targets: SelectableBatchTargetRow[]
  measures: RoutingMeasure[]
  selection: TargetMeasureSelection
}) {
  const dzoTargets = targets.filter((t) => t.subdivisionId == null)
  if (dzoTargets.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">ДЗО — все меры на организацию</p>
      <p className="text-sm text-muted-foreground">
        Для подведомственных организаций назначаются все выбранные меры целиком
      </p>
      <ul className="text-sm space-y-1">
        {dzoTargets.map((target) => {
          const key = targetKey(target)
          const count = selection.get(key)?.size ?? measures.length
          return (
            <li key={key} className="flex items-center gap-2">
              <Badge variant="outline">{target.organizationName}</Badge>
              <span className="text-muted-foreground">{count} мер</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
