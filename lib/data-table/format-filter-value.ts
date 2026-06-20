import {
  formatDisplayDate,
  formatDisplayDateTime,
  isIsoDateString,
} from "@/lib/datetime/format"

type FilterColumnMeta = {
  valueType?: "date" | "datetime"
  valueLabels?: Record<string, string>
}

/** Canonical string for faceted filter match (must match row cell values). */
export function normalizeFilterValue(value: unknown): string {
  if (value == null || value === "") return "—"
  if (value instanceof Date) return value.toISOString()
  const str = String(value)
  if (isIsoDateString(str)) {
    const date = new Date(str)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return str
}

export function formatFilterDisplayValue(
  value: unknown,
  meta: FilterColumnMeta | undefined,
  timeZone: string
): string {
  if (value == null || value === "") return "—"

  const str = normalizeFilterValue(value)
  if (str === "—") return str

  if (meta?.valueLabels?.[str]) return meta.valueLabels[str]

  const asDate =
    meta?.valueType === "date" ||
    meta?.valueType === "datetime" ||
    isIsoDateString(str)

  if (asDate) {
    return meta?.valueType === "datetime"
      ? formatDisplayDateTime(str, timeZone)
      : formatDisplayDate(str, timeZone)
  }

  return str
}
