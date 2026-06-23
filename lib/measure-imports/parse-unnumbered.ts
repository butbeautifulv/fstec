import type { ParsedMeasureItem } from "@/lib/measure-imports/parse-docx"

const BDU_CODE_RE = /BDU:\d{4}-\d{5}/
const IMPERATIVE_START_RE =
  /^(провести|внедрить|реализовать|настроить|разработать|возложить|отключить|использовать|произвести|обеспечить|организовать|сменить|ограничить|осуществить)/i

const RECOMMENDATION_MARKER_RE =
  /(рекомендуется|необходимо|в целях повышения защищенности|считаем необходимым)/i

export function parseBduInlineMeasures(paragraphs: string[]): ParsedMeasureItem[] {
  const text = paragraphs.join("\n\n")
  const bduMatch = text.match(BDU_CODE_RE)
  if (!bduMatch) return []

  const bduIndex = paragraphs.findIndex((p) => BDU_CODE_RE.test(p))
  if (bduIndex < 0) return []

  const compensating: string[] = []
  for (let i = bduIndex + 1; i < paragraphs.length; i++) {
    const p = paragraphs[i]!.trim()
    if (/^По результатам выполнения/i.test(p)) break
    if (LETTER_FOOTER_RE.test(p)) break
    if (IMPERATIVE_START_RE.test(p) || p.length < 200) {
      compensating.push(p)
    }
  }

  const mainDesc = paragraphs.slice(bduIndex, bduIndex + 1).join("\n\n")
  const items: ParsedMeasureItem[] = [
    {
      code: bduMatch[0],
      description: compensating.length
        ? `${mainDesc}\n\n${compensating.join("\n\n")}`
        : mainDesc,
      sortOrder: 0,
    },
  ]

  return items
}

const LETTER_FOOTER_RE =
  /^(По результатам выполнения|Исп\.\s*и\s*отп\.|тел\.\s*\(|В\.Лютиков)/i

export function parseImperativeListMeasures(paragraphs: string[]): ParsedMeasureItem[] {
  let startIndex = -1
  for (let i = 0; i < paragraphs.length; i++) {
    if (RECOMMENDATION_MARKER_RE.test(paragraphs[i]!)) {
      startIndex = i + 1
      break
    }
  }
  if (startIndex < 0) return []

  const measures: string[] = []
  for (let i = startIndex; i < paragraphs.length; i++) {
    const p = paragraphs[i]!.trim()
    if (LETTER_FOOTER_RE.test(p)) break
    if (IMPERATIVE_START_RE.test(p)) {
      measures.push(p)
    }
  }

  return measures.map((description, sortOrder) => ({
    code: String(sortOrder + 1),
    description,
    sortOrder,
  }))
}

const SHA256_LINE_RE = /^[a-f0-9]{64}\.?$/i
const DOMAIN_LINE_RE = /^[a-z0-9][a-z0-9._[\]-]*\.[a-z]{2,};?$/i
const BRACKET_DOMAIN_LINE_RE = /^[a-z0-9][a-z0-9._-]*\[\.\][a-z]{2,};?$/i

export function isIocDomainLine(text: string): boolean {
  const line = text.trim()
  return DOMAIN_LINE_RE.test(line) || BRACKET_DOMAIN_LINE_RE.test(line)
}

export function parseIocDomainMeasures(paragraphs: string[]): ParsedMeasureItem[] {
  const domains = paragraphs.filter((p) => isIocDomainLine(p))
  const iocHeader = paragraphs.find(
    (p) => /индикатор/i.test(p) && /компрометац/i.test(p)
  )
  if (domains.length < 2 && !iocHeader) return []

  const header = iocHeader ?? ""
  return [
    {
      code: "ioc-domains",
      description: [header, domains.length > 0 ? `Домены:\n${domains.join("\n")}` : ""]
        .filter(Boolean)
        .join("\n\n"),
      sortOrder: 0,
    },
  ]
}

export function parseIocHashMeasures(paragraphs: string[]): ParsedMeasureItem[] {
  const hashes = paragraphs.filter((p) => SHA256_LINE_RE.test(p.trim()))
  if (hashes.length === 0) return []

  const domains = paragraphs.filter((p) => isIocDomainLine(p))
  const siemParagraph = paragraphs.find((p) =>
    /системы мониторинга событий/i.test(p)
  )

  const items: ParsedMeasureItem[] = []
  if (domains.length > 0 || siemParagraph) {
    const desc = [
      siemParagraph ?? "",
      domains.length > 0 ? `Домены:\n${domains.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
    items.push({ code: "1", description: desc, sortOrder: 0 })
  }

  items.push({
    code: "ioc-hashes",
    description: hashes.map((h) => h.replace(/\.$/, "")).join("\n"),
    sortOrder: items.length,
  })

  return items
}

export function parseRestrictionLiftMeasure(paragraphs: string[]): ParsedMeasureItem[] {
  const text = paragraphs.join("\n\n")
  if (!/сняти/i.test(text) || !/ограничен/i.test(text)) return []
  return [
    {
      code: "1",
      description: text.slice(0, 4000),
      sortOrder: 0,
    },
  ]
}

export function parseUnnumberedMeasures(paragraphs: string[]): ParsedMeasureItem[] {
  const bdu = parseBduInlineMeasures(paragraphs)
  if (bdu.length > 0) return bdu
  const imperative = parseImperativeListMeasures(paragraphs)
  if (imperative.length > 0) return imperative
  const domains = parseIocDomainMeasures(paragraphs)
  if (domains.length > 0) return domains
  const ioc = parseIocHashMeasures(paragraphs)
  if (ioc.length > 0) return ioc
  return parseRestrictionLiftMeasure(paragraphs)
}
