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

type NumberedBlock = {
  code: string
  paragraphs: string[]
}

const NUMBERED_ITEM_RE = /^(\d+(?:\.\d+)+|\d+)\.\s*(.+)$/
const NUMBERED_BLOCK_START_RE = /^(\d+(?:\.\d+)*)\.\s*(.*)$/
const BDU_CODE_RE = /BDU:\d{4}-\d{5}/
const LETTER_FOOTER_START_RE = /^По результатам выполнения/i
const LETTER_APPENDIX_LINE_RE = /^Приложение\s*:/i
const LETTER_EXECUTOR_LINE_RE = /^Исп\.\s*и\s*отп\./i
const LETTER_PHONE_LINE_RE = /^тел\.\s*\(/i
const LETTER_SIGNATORY_LINE_RE = /^[А-ЯA-Z]\.[А-ЯA-Z][а-яa-zё-]+$/

function isLetterFooterParagraph(text: string): boolean {
  const line = text.trim()
  if (!line) return true
  if (LETTER_FOOTER_START_RE.test(line)) return true
  if (LETTER_APPENDIX_LINE_RE.test(line)) return true
  if (LETTER_EXECUTOR_LINE_RE.test(line)) return true
  if (LETTER_PHONE_LINE_RE.test(line)) return true
  if (LETTER_SIGNATORY_LINE_RE.test(line)) return true
  return false
}

/** Remove trailing letter footer (report instructions, appendix line, signature). */
function trimBlockFooter(block: NumberedBlock): NumberedBlock {
  if (block.paragraphs.length <= 1) return block

  let cutIndex = block.paragraphs.length
  for (let i = block.paragraphs.length - 1; i >= 1; i--) {
    if (isLetterFooterParagraph(block.paragraphs[i]!)) {
      cutIndex = i
    } else {
      break
    }
  }

  if (cutIndex < block.paragraphs.length) {
    return { ...block, paragraphs: block.paragraphs.slice(0, cutIndex) }
  }
  return block
}

export function isAppendixDocument(
  paragraphs: string[],
  originalName: string
): boolean {
  const nameLower = originalName.toLowerCase()
  if (nameLower.includes("приложение")) return true

  const numbered = paragraphs.filter((p) => NUMBERED_ITEM_RE.test(p))
  if (numbered.length === 0) {
    const shaCount = paragraphs.filter((p) => /^[a-f0-9]{64}$/i.test(p)).length
    return shaCount >= 3
  }
  return false
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

  return { code, description: fullText }
}

export function parseMeasureItemsFromParagraphs(
  paragraphs: string[]
): ParsedMeasureItem[] {
  const blocks = filterMeasureBlocks(groupNumberedBlocks(paragraphs)).map(trimBlockFooter)

  return blocks.map((block, sortOrder) => {
    const { code, description } = splitBlockContent(block)
    return { code, description, sortOrder }
  })
}

export function detectImportKind(
  paragraphs: string[],
  originalName: string
): "LETTER" | "APPENDIX" {
  return isAppendixDocument(paragraphs, originalName) ? "APPENDIX" : "LETTER"
}
