"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  clampSliderRange,
  dayIndex,
  indexToDay,
  parsePeriodFromSearchParams,
  periodSearchParams,
  presetToRangeWithBounds,
  type PeriodBounds,
  type PeriodPreset,
  type PeriodRange,
} from "@/lib/dashboard/period-range"

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "30d", label: "30 дней" },
  { id: "90d", label: "90 дней" },
  { id: "1y", label: "Год" },
  { id: "all", label: "Всё" },
]

export function DashboardPeriodControl({
  minDate,
  maxDate,
  embedded = false,
  label = "Период выдачи поручений:",
}: {
  minDate: string
  maxDate: string
  embedded?: boolean
  label?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDraggingRef = useRef(false)
  const bounds = useMemo<PeriodBounds>(
    () => ({ min: minDate, max: maxDate }),
    [minDate, maxDate]
  )
  const period = useMemo(
    () =>
      parsePeriodFromSearchParams(
        Object.fromEntries(searchParams.entries()),
        bounds
      ),
    [searchParams, bounds]
  )

  const totalDays = Math.max(1, dayIndex(maxDate, minDate))

  const periodIndices = useMemo((): [number, number] => {
    if (period.preset === "all" && !period.from && !period.to) {
      return [0, totalDays]
    }
    return clampSliderRange(
      period.from ?? minDate,
      period.to ?? maxDate,
      minDate,
      maxDate
    )
  }, [period.preset, period.from, period.to, minDate, maxDate, totalDays])

  const [sliderValue, setSliderValue] = useState(periodIndices)

  useEffect(() => {
    if (isDraggingRef.current) return
    setSliderValue(periodIndices)
  }, [periodIndices])

  const applyPeriod = useCallback(
    (next: PeriodRange, extra?: URLSearchParams) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("from")
      params.delete("to")
      params.delete("period")
      for (const [key, value] of periodSearchParams(next).entries()) {
        params.set(key, value)
      }
      if (extra) {
        for (const [key, value] of extra.entries()) {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : "?")
    },
    [router, searchParams]
  )

  function applyPreset(preset: PeriodPreset) {
    if (preset === "all") {
      applyPeriod({ preset: "all" })
      setSliderValue([0, totalDays])
      return
    }
    const next = presetToRangeWithBounds(preset, bounds)
    setSliderValue(
      clampSliderRange(next.from ?? minDate, next.to ?? maxDate, minDate, maxDate)
    )
    applyPeriod(next)
  }

  function commitSlider(values: number[]) {
    isDraggingRef.current = false
    const clamped = clampSliderRange(
      indexToDay(values[0] ?? 0, minDate),
      indexToDay(values[1] ?? totalDays, minDate),
      minDate,
      maxDate
    )
    setSliderValue(clamped)

    if (
      clamped[0] === periodIndices[0] &&
      clamped[1] === periodIndices[1]
    ) {
      return
    }

    const from = indexToDay(clamped[0], minDate)
    const to = indexToDay(clamped[1], minDate)
    applyPeriod({ from, to })
  }

  const activePreset =
    period.preset === "all"
      ? "all"
      : period.preset ?? (period.from || period.to ? undefined : "90d")

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3",
        !embedded && "rounded-lg border bg-card p-4"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={activePreset === p.id ? "default" : "outline"}
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <Slider
        key={`${minDate}-${maxDate}`}
        min={0}
        max={totalDays}
        step={1}
        value={sliderValue}
        onValueChange={(values) => {
          isDraggingRef.current = true
          setSliderValue(values as [number, number])
        }}
        onValueCommit={commitSlider}
        className="w-full max-w-xl"
      />
      <p className="text-xs text-muted-foreground tabular-nums">
        {indexToDay(sliderValue[0] ?? 0, minDate)} —{" "}
        {indexToDay(sliderValue[1] ?? totalDays, minDate)}
      </p>
    </div>
  )
}
