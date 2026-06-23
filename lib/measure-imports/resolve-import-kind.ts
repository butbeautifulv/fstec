import { detectImportKind } from "@/lib/measure-imports/parse-docx"
import type { MeasureImportKind } from "@prisma/client"

/**
 * Letters misclassified as APPENDIX (SHA256/IOC heuristics) still contain
 * numbered measures — treat as LETTER for parse/commit.
 */
export function resolveLetterImportKind(input: {
  paragraphs: string[]
  originalName: string
  parentImportId: number | null
  rawMeasureCount: number
}): MeasureImportKind {
  if (input.parentImportId != null) return "APPENDIX"

  const detected = detectImportKind(input.paragraphs, input.originalName)
  if (detected === "LETTER") return "LETTER"
  if (input.rawMeasureCount > 0) return "LETTER"
  return "APPENDIX"
}
