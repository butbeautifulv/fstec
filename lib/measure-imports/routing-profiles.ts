import type { MeasureTag } from "@/lib/measure-imports/tag-measure"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

export type StaticProfile = {
  tags: MeasureTag[]
  confidence: number
}

export const STATIC_ROUTING_PROFILES: Record<
  string,
  StaticProfile | { [sub: string]: Record<string, number> }
> = {
  ДЦОД: { tags: ["network", "ioc"], confidence: 0.85 },
  ДИТСБ: { tags: ["siem", "vulnerability"], confidence: 0.75 },
  ДИТСС: { tags: ["siem", "vulnerability"], confidence: 0.7 },
  ДКИТИ: { tags: ["email", "organizational"], confidence: 0.65 },
  ДИТСУП: { tags: ["organizational", "vulnerability"], confidence: 0.6 },
  _generated: loadGeneratedProfiles(),
}

function loadGeneratedProfiles(): Record<string, Record<string, number>> {
  try {
    const path = join(process.cwd(), "lib/measure-imports/routing-profiles.generated.json")
    if (!existsSync(path)) return {}
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      profiles?: Record<string, Record<string, number>>
    }
    return data.profiles ?? {}
  } catch {
    return {}
  }
}
