import { expandCompositeBlocks, shouldExpandComposites, type NumberedBlock } from "@/lib/measure-imports/parse-composite"
import { parseUnnumberedMeasures } from "@/lib/measure-imports/parse-unnumbered"
import {
  extractDocxTablesAsync,
  tableRowsToParagraphs,
} from "@/lib/measure-imports/parse-docx-tables"

export async function extractDocxParagraphsAsync(buffer: Buffer): Promise<string[]> {
  const JSZip = (await import("jszip")).default
  const zip = await JSZip.loadAsync(buffer)
  const docXml = await zip.file("word/document.xml")?.async("string")
  if (!docXml) throw new Error("INVALID_DOCX")

  const paragraphs: string[] = []
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g

  for (const match of docXml.matchAll(paragraphRegex)) {
    const line = extractParagraphText(match[0])
    if (line) paragraphs.push(line)
  }

  if (paragraphs.filter((p) => /^\d/.test(p.trim())).length === 0) {
    const tables = await extractDocxTablesAsync(buffer)
    const fromTables = tableRowsToParagraphs(tables)
    if (fromTables.length > 0) {
      paragraphs.push(...fromTables)
    }
  }

  return paragraphs
}

const PARAGRAPH_TOKEN_RE =
  /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:br\b[^>]*\/?>|<w:cr\b[^>]*\/?>|<w:tab\b[^>]*\/?>/g

function extractParagraphText(paragraphXml: string): string {
  const parts: string[] = []

  for (const match of paragraphXml.matchAll(PARAGRAPH_TOKEN_RE)) {
    if (match[1] !== undefined) {
      parts.push(match[1])
    } else {
      parts.push(" ")
    }
  }

  return parts.join("").replace(/\s+/g, " ").trim()
}

export type ParsedMeasureItem = {
  code: string | null
  description: string
  sortOrder: number
}

const NUMBERED_ITEM_RE = /^(\d+(?:\.\d+)+|\d+)\.\s*(.+)$/
const NUMBERED_BLOCK_START_RE = /^(\d+(?:\.\d+)*)\.\s*(.*)$/
const BDU_CODE_RE = /BDU:\d{4}-\d{5}/
const SHA256_LINE_RE = /^[a-f0-9]{64}$/i
const LETTER_FOOTER_START_RE = /^По результатам выполнения/i
const LETTER_APPENDIX_LINE_RE = /^Приложение\s*:/i
const LETTER_EXECUTOR_LINE_RE = /^Исп\.\s*и\s*отп\./i
const LETTER_PHONE_LINE_RE = /^тел\.\s*\(/i
const LETTER_SIGNATORY_LINE_RE = /^[А-ЯA-Z]\.[А-ЯA-Z][а-яa-zё-]+$/
const LETTER_FOOTER_SUBORDINATE_RE = /^В случае направления данных рекомендаций/i
const LETTER_FOOTER_EDITABLE_RE = /редактируемом формате/i
const LETTER_FOOTER_REPORT_RE = /просим проинформировать ФСТЭК/i
const LETTER_FOOTER_INLINE_RE = /\n\nПо результатам выполнения[\s\S]*$/i

export type AppendixKind = "IOC" | "RECOMMENDATIONS"

function countSha256(paragraphs: string[]): number {
  return paragraphs.filter((p) => SHA256_LINE_RE.test(p.trim())).length
}

function countNumbered(paragraphs: string[]): number {
  return paragraphs.filter((p) => NUMBERED_ITEM_RE.test(p)).length
}

export function classifyAppendixKind(
  paragraphs: string[],
  originalName: string
): AppendixKind | null {
  const nameLower = originalName.toLowerCase()
  const numberedCount = countNumbered(paragraphs)
  const shaCount = countSha256(paragraphs)
  const shaRatio = paragraphs.length > 0 ? shaCount / paragraphs.length : 0

  const hasNestedNumbering = paragraphs.some((p) => /^\d+\.\d+\./.test(p.trim()))
  if (hasNestedNumbering && numberedCount >= 3 && !nameLower.includes("приложение")) {
    return null
  }

  if (numberedCount >= 3 && shaRatio < 0.3) return "RECOMMENDATIONS"
  if (nameLower.includes("приложение") && numberedCount >= 1 && shaRatio < 0.5) {
    return "RECOMMENDATIONS"
  }
  if (shaCount >= 3 && numberedCount === 0) return "IOC"
  if (nameLower.includes("приложение") && shaRatio >= 0.1) return "IOC"
  if (nameLower.includes("приложение")) return "IOC"
  if (numberedCount === 0 && shaCount >= 3) return "IOC"
  return null
}

function isLetterFooterParagraph(text: string): boolean {
  const line = text.trim()
  if (!line) return true
  if (LETTER_FOOTER_START_RE.test(line)) return true
  if (LETTER_FOOTER_SUBORDINATE_RE.test(line)) return true
  if (LETTER_FOOTER_EDITABLE_RE.test(line)) return true
  if (LETTER_FOOTER_REPORT_RE.test(line)) return true
  if (LETTER_APPENDIX_LINE_RE.test(line)) return true
  if (LETTER_EXECUTOR_LINE_RE.test(line)) return true
  if (LETTER_PHONE_LINE_RE.test(line)) return true
  if (LETTER_SIGNATORY_LINE_RE.test(line)) return true
  return false
}

function trimBlockFooter(block: NumberedBlock): NumberedBlock {
  if (block.paragraphs.length <= 1) return block

  for (let i = 1; i < block.paragraphs.length; i++) {
    if (isLetterFooterParagraph(block.paragraphs[i]!)) {
      return { ...block, paragraphs: block.paragraphs.slice(0, i) }
    }
  }

  return block
}

function stripInlineLetterFooter(description: string): string {
  return description.replace(LETTER_FOOTER_INLINE_RE, "").trimEnd()
}

/** @deprecated Use classifyAppendixKind */
export function isAppendixDocument(
  paragraphs: string[],
  originalName: string
): boolean {
  return classifyAppendixKind(paragraphs, originalName) != null
}

function groupNumberedBlocks(paragraphs: string[]): NumberedBlock[] {
  const blocks: NumberedBlock[] = []
  let current: NumberedBlock | null = null

  for (const paragraph of paragraphs) {
    const match = paragraph.match(NUMBERED_BLOCK_START_RE)
    if (match) {
      if (current) blocks.push(current)
      current = { code: match[1], paragraphs: [paragraph] }
    } else if (current) {
      current.paragraphs.push(paragraph)
    }
  }

  if (current) blocks.push(current)
  return blocks
}

function filterMeasureBlocks(blocks: NumberedBlock[]): NumberedBlock[] {
  const topLevelsWithSubItems = new Set<string>()

  for (const block of blocks) {
    if (block.code.includes(".")) {
      topLevelsWithSubItems.add(block.code.split(".")[0]!)
    }
  }

  return blocks.filter((block) => {
    if (block.code.includes(".")) return true

    const fullText = block.paragraphs.join("\n\n")
    if (BDU_CODE_RE.test(fullText)) return true

    return !topLevelsWithSubItems.has(block.code)
  })
}

function splitBlockContent(block: NumberedBlock): {
  code: string
  description: string
} {
  const fullText = block.paragraphs.join("\n\n")
  const bduMatch = fullText.match(BDU_CODE_RE)
  const code = bduMatch?.[0] ?? block.code

  return { code, description: stripInlineLetterFooter(fullText) }
}

export function parseMeasureItemsFromParagraphs(
  paragraphs: string[]
): ParsedMeasureItem[] {
  const grouped = groupNumberedBlocks(paragraphs)
  const expanded = shouldExpandComposites(grouped)
    ? expandCompositeBlocks(grouped)
    : grouped
  const blocks = filterMeasureBlocks(expanded).map(trimBlockFooter)

  if (blocks.length === 0) {
    return parseUnnumberedMeasures(paragraphs)
  }

  return blocks.map((block, sortOrder) => {
    const { code, description } = splitBlockContent(block)
    return { code, description, sortOrder }
  })
}

export function detectImportKind(
  paragraphs: string[],
  originalName: string
): "LETTER" | "APPENDIX" {
  return classifyAppendixKind(paragraphs, originalName) != null ? "APPENDIX" : "LETTER"
}

export function isRecommendationsAppendix(
  paragraphs: string[],
  originalName: string
): boolean {
  return classifyAppendixKind(paragraphs, originalName) === "RECOMMENDATIONS"
}

export function isIocAppendix(paragraphs: string[], originalName: string): boolean {
  return classifyAppendixKind(paragraphs, originalName) === "IOC"
}
