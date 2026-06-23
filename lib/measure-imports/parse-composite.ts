export type NumberedBlock = {
  code: string
  paragraphs: string[]
}

export const COMPOSITE_ACTION_RE =
  /^(Кроме того,|Также необходимо|Для предотвращения.+необходимо обеспечить)/i

export const THREAT_PREAMBLE_RE = /^Хакерск/i

export const CROSS_REF_BOILERPLATE_RE =
  /реализовать меры защиты, указанные в пунктах\s+1\.1/i

export function isBoilerplateParagraph(text: string): boolean {
  const line = text.trim()
  if (!line) return true
  if (THREAT_PREAMBLE_RE.test(line)) return true
  if (CROSS_REF_BOILERPLATE_RE.test(line)) return true
  if (/^Для предотвращения реализации угроз.+фишинговым рассылкам/i.test(line)) {
    return true
  }
  return false
}

export function stripThreatPreamble(paragraphs: string[]): string[] {
  return paragraphs.filter((p) => !isBoilerplateParagraph(p))
}

export function shouldExpandComposites(blocks: NumberedBlock[]): boolean {
  const sectionOneSubs = blocks.filter((b) => /^1\.\d+$/.test(b.code))
  return sectionOneSubs.length === 7 && sectionOneSubs.some((b) => b.code === "1.7")
}

function lineHasThreatPreamble(text: string): boolean {
  const body = text.replace(/^\d+(?:\.\d+)*\.\s*/, "").trim()
  return THREAT_PREAMBLE_RE.test(body)
}

export function splitCompositeBlock(block: NumberedBlock): NumberedBlock[] {
  const topLevel = !block.code.includes(".")
  const codeNum = Number(block.code)
  if (!topLevel || Number.isNaN(codeNum) || codeNum < 2) {
    return [block]
  }

  const rawBody = block.paragraphs.slice(1)
  const hadThreatPreamble = block.paragraphs.some(lineHasThreatPreamble)
  const bodyParagraphs = stripThreatPreamble(rawBody)
  if (bodyParagraphs.length === 0) {
    return block.paragraphs.length > 0 ? [block] : []
  }

  if (!hadThreatPreamble) {
    return [block]
  }

  const segments: string[][] = []
  let current: string[] = []

  for (const paragraph of bodyParagraphs) {
    if (COMPOSITE_ACTION_RE.test(paragraph.trim()) && current.length > 0) {
      segments.push(current)
      current = [paragraph]
    } else {
      current.push(paragraph)
    }
  }
  if (current.length > 0) segments.push(current)

  if (segments.length <= 1 && segments[0]?.length === bodyParagraphs.length) {
    const onlyAction = bodyParagraphs.filter((p) => COMPOSITE_ACTION_RE.test(p.trim()))
    if (onlyAction.length === 0) {
      if (bodyParagraphs.length > 0) {
        return [{ code: block.code, paragraphs: block.paragraphs }]
      }
      return []
    }
    if (onlyAction.length === 1) {
      return [{ code: block.code, paragraphs: [block.paragraphs[0]!, ...onlyAction] }]
    }
    return onlyAction.map((p, i) => ({
      code: `${block.code}.${i + 1}`,
      paragraphs: [p],
    }))
  }

  return segments.map((paragraphs, index) => ({
    code: segments.length === 1 ? block.code : `${block.code}.${index + 1}`,
    paragraphs,
  }))
}

export function expandCompositeBlocks(blocks: NumberedBlock[]): NumberedBlock[] {
  const expanded: NumberedBlock[] = []
  for (const block of blocks) {
    const parts = splitCompositeBlock(block)
    expanded.push(...parts)
  }
  return expanded
}
