import type { MeasureImportStatus } from "@prisma/client"

export function resolveParseStatus(input: {
  parsedItemCount: number
  needsAppendix: boolean
  parentImportId: number | null
}): { status: MeasureImportStatus; parseError: string | null } {
  if (input.parsedItemCount > 0) {
    return { status: "PARSED", parseError: null }
  }
  if (input.parentImportId == null && input.needsAppendix) {
    return { status: "PARSED", parseError: null }
  }
  return { status: "FAILED", parseError: "NO_ITEMS_FOUND" }
}

export function isRoutingShellImport(input: {
  kind: "LETTER" | "APPENDIX"
  status: MeasureImportStatus
  needsAppendix: boolean
  itemCount: number
  measureCount: number
}): boolean {
  return (
    input.kind === "LETTER" &&
    input.status === "PARSED" &&
    input.needsAppendix &&
    input.itemCount === 0 &&
    input.measureCount === 0
  )
}
