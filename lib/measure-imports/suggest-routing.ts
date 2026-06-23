import type { MeasureTag } from "@/lib/measure-imports/tag-measure"
import { STATIC_ROUTING_PROFILES } from "@/lib/measure-imports/routing-profiles"

export type RoutingSuggestion = {
  subdivisionName: string
  confidence: number
  reason: string
}

export type RoutingInput = {
  measureTags: MeasureTag[]
  measureText: string
  subdivisions: Array<{ id: number; name: string }>
}

function scoreSubdivision(
  tags: MeasureTag[],
  profile: Record<string, number>,
  total: number
): number {
  if (total === 0 || tags.length === 0) return 0.1
  let hit = 0
  for (const tag of tags) {
    hit += profile[tag] ?? 0
  }
  return Math.min(0.95, 0.15 + hit / Math.max(total, 1))
}

export function suggestRouting(input: RoutingInput): RoutingSuggestion[] {
  const { measureTags, subdivisions } = input
  const results: RoutingSuggestion[] = []

  for (const sub of subdivisions) {
    const staticProfile = STATIC_ROUTING_PROFILES[sub.name]
    if (staticProfile) {
      const matched = measureTags.filter((t) => staticProfile.tags.includes(t))
      if (matched.length > 0) {
        results.push({
          subdivisionName: sub.name,
          confidence: staticProfile.confidence,
          reason: `Профиль: ${matched.join(", ")}`,
        })
        continue
      }
    }

    const generated = STATIC_ROUTING_PROFILES._generated?.[sub.name] as
      | Record<string, number>
      | undefined
    if (generated) {
      const total = Object.values(generated).reduce((a, b) => a + b, 0)
      const confidence = scoreSubdivision(measureTags, generated, total)
      if (confidence > 0.2) {
        results.push({
          subdivisionName: sub.name,
          confidence,
          reason: "Историческая частота по отчётам",
        })
      }
    }
  }

  if (results.length === 0) {
    return subdivisions.map((sub) => ({
      subdivisionName: sub.name,
      confidence: 0.1,
      reason: "Нет сигнала — все подразделения",
    }))
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

export function suggestRoutingForMeasures(
  measures: Array<{ tags: MeasureTag[]; description: string }>,
  subdivisions: Array<{ id: number; name: string }>
): Map<number, RoutingSuggestion[]> {
  const map = new Map<number, RoutingSuggestion[]>()
  measures.forEach((measure, index) => {
    map.set(
      index,
      suggestRouting({
        measureTags: measure.tags,
        measureText: measure.description,
        subdivisions,
      })
    )
  })
  return map
}
