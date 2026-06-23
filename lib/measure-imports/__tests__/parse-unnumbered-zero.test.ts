import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { extractDocxParagraphsAsync, parseMeasureItemsFromParagraphs } from "../parse-docx"
import { parseIocDomainMeasures, parseUnnumberedMeasures } from "../parse-unnumbered"

const CORPUS = join(process.cwd(), ".external/240 93 6837")

describe("zero letter parsers", () => {
  it("parses 2026 imperative list", async () => {
    const buf = readFileSync(join(CORPUS, "240 93 2026/240 93 2026.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buf)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    expect(items.length).toBeGreaterThanOrEqual(2)
  })

  it("parses 2387 IOC hashes", async () => {
    const buf = readFileSync(join(CORPUS, "240 93 2387/240 93 2387.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buf)
    const items = parseUnnumberedMeasures(paragraphs)
    expect(items.length).toBeGreaterThanOrEqual(1)
  })

  it("parses 1569 restriction lift as single measure", async () => {
    const buf = readFileSync(join(CORPUS, "240 93 1569/240 93 1569.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buf)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    expect(items.length).toBeGreaterThanOrEqual(1)
  })

  it("parses 1713 domain-only IOC appendix", async () => {
    const buf = readFileSync(
      join(CORPUS, "240 93 1713/Приложение 240 93 1713 ДКИТИ.docx")
    )
    const paragraphs = await extractDocxParagraphsAsync(buf)
    const items = parseIocDomainMeasures(paragraphs)
    expect(items.length).toBe(1)
    expect(items[0]?.code).toBe("ioc-domains")
    expect(items[0]?.description).toContain("seychaspozzhe[.]com")
  })

  it("parses 1352 DZO appendix domains", async () => {
    const buf = readFileSync(
      join(CORPUS, "240 93 1352/Приложение 240 93 1352 — ДЦОД.docx")
    )
    const paragraphs = await extractDocxParagraphsAsync(buf)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    expect(items.length).toBeGreaterThanOrEqual(1)
  })
})
