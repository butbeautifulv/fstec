const DOC_NUMBER_FROM_FILENAME_RE = /(\d{2,3})\s+(\d{2})\s+(\d{4})/
const DOC_NUMBER_SLASH_RE = /(\d{2,3}\/\d{2}\/\d{4})/
const TITLE_RE =
  /О мерах по повышению защищенности информационной инфраструктуры/i
const DUE_DATE_RE =
  /до\s+(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i

const MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
}

export type ExtractedMetadata = {
  documentNumber: string | null
  title: string | null
  reportDueAt: Date | null
}

export function extractDocumentNumber(
  paragraphs: string[],
  originalName: string
): string | null {
  const slashMatch = originalName.match(DOC_NUMBER_SLASH_RE)
  if (slashMatch) return slashMatch[1]

  const filenameMatch = originalName.match(DOC_NUMBER_FROM_FILENAME_RE)
  if (filenameMatch) {
    return `${filenameMatch[1]}/${filenameMatch[2]}/${filenameMatch[3]}`
  }

  const text = paragraphs.join("\n")
  const textSlash = text.match(DOC_NUMBER_SLASH_RE)
  if (textSlash) return textSlash[1]

  const infoMsg = text.match(/№\s*(\d{2,3}\/\d{2}\/\d{4})/)
  if (infoMsg) return infoMsg[1]

  return null
}

export function extractTitle(paragraphs: string[]): string | null {
  for (const paragraph of paragraphs) {
    if (TITLE_RE.test(paragraph)) {
      return paragraph.match(TITLE_RE)?.[0] ?? paragraph.slice(0, 500)
    }
  }
  return null
}

export function extractReportDueAt(paragraphs: string[]): Date | null {
  const text = paragraphs.join(" ")
  const match = text.match(DUE_DATE_RE)
  if (!match) return null

  const day = Number(match[1])
  const month = MONTHS[match[2].toLowerCase()]
  const year = Number(match[3])
  if (month == null || Number.isNaN(day) || Number.isNaN(year)) return null

  return new Date(Date.UTC(year, month, day, 12, 0, 0))
}

export function extractMetadata(
  paragraphs: string[],
  originalName: string
): ExtractedMetadata {
  return {
    documentNumber: extractDocumentNumber(paragraphs, originalName),
    title: extractTitle(paragraphs),
    reportDueAt: extractReportDueAt(paragraphs),
  }
}

export function defaultOrderTitle(documentNumber: string | null, title: string | null): string {
  if (documentNumber && title) {
    return `Поручение по письму ${documentNumber}`
  }
  if (documentNumber) return `Поручение по письму ${documentNumber}`
  return "Поручение по документу ФСТЭК"
}

export function appendixMeasureName(documentNumber: string | null): string {
  if (documentNumber) {
    return `Проверить файловые индикаторы (приложение ${documentNumber})`
  }
  return "Проверить файловые индикаторы (приложение)"
}

export function composeMeasureItemName(input: {
  documentNumber: string | null
  title: string | null
  code: string | null
  sortOrder?: number
}): string {
  const codePart =
    input.code ?? (input.sortOrder != null ? `#${input.sortOrder + 1}` : "—")

  if (input.documentNumber) {
    return `${input.documentNumber} · ${codePart}`
  }

  if (input.title) {
    const shortTitle =
      input.title.length > 80 ? `${input.title.slice(0, 77)}…` : input.title
    return `${shortTitle} · ${codePart}`
  }

  return `Мера · ${codePart}`
}
