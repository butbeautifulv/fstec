import { existsSync } from "node:fs"
import { join } from "node:path"
import { tagMeasure, type MeasureTag } from "@/lib/measure-imports/tag-measure"

const MODEL_PATH = join(process.cwd(), "routing-model.cbm")

export function isRoutingModelAvailable(): boolean {
  return existsSync(MODEL_PATH)
}

/** Optional CatBoost boost — returns null if model missing. */
export function routingModelBoost(
  _text: string,
  tags: MeasureTag[]
): Record<string, number> | null {
  if (!isRoutingModelAvailable()) return null
  // Inference via external process is optional; rules are primary.
  void tags
  return null
}

export function enrichTagsWithModel(text: string, code: string | null): MeasureTag[] {
  return tagMeasure(text, code)
}
