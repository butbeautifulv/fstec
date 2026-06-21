import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  detectImportKind,
  extractDocxParagraphsAsync,
  isAppendixDocument,
  parseMeasureItemsFromParagraphs,
} from "@/lib/measure-imports/parse-docx"
import { composeMeasureItemName, extractMetadata } from "@/lib/measure-imports/extract-metadata"

const FIXTURES = join(process.cwd(), ".external/docx_examples")
const hasFixtures = existsSync(join(FIXTURES, "240 93 4164.docx"))

describe("isAppendixDocument", () => {
  it("detects appendix by filename", () => {
    expect(isAppendixDocument([], "Приложение 240 93 4164.docx")).toBe(true)
  })

  it("detects appendix by sha hashes without numbered items", () => {
    const hashes = ["a".repeat(64), "b".repeat(64), "c".repeat(64)]
    expect(isAppendixDocument(hashes, "doc.docx")).toBe(true)
  })

  it("treats numbered letter as non-appendix", () => {
    expect(
      isAppendixDocument(["1. Первая мера", "2. Вторая мера"], "240 93 4164.docx")
    ).toBe(false)
  })
})

describe("detectImportKind", () => {
  it("returns APPENDIX for appendix documents", () => {
    expect(detectImportKind([], "Приложение test.docx")).toBe("APPENDIX")
  })

  it("returns LETTER for regular documents", () => {
    expect(detectImportKind(["1. Measure"], "240 93 4164.docx")).toBe("LETTER")
  })
})

describe("parseMeasureItemsFromParagraphs", () => {
  it("parses nested numbered items", () => {
    const items = parseMeasureItemsFromParagraphs([
      "1. Top level",
      "1.1. Nested measure with details",
      "1.2. Another nested",
      "2. Second top",
    ])
    expect(items.map((item) => item.code)).toEqual(["1.1", "1.2", "2"])
  })

  it("uses BDU code when present", () => {
    const items = parseMeasureItemsFromParagraphs([
      "1. Measure text BDU:2024-12345 additional info",
    ])
    expect(items[0]?.code).toBe("BDU:2024-12345")
  })

  it("trims letter footer from block", () => {
    const items = parseMeasureItemsFromParagraphs([
      "1. Main content line",
      "По результатам выполнения меры представить отчёт",
      "Приложение: Индикаторы",
      "Исп. и отп. Иванов",
    ])
    expect(items[0]?.description).not.toContain("Исп. и отп.")
    expect(items[0]?.description).toContain("Main content line")
  })
})

describe.skipIf(!hasFixtures)("docx fixtures", () => {
  it("parses 240 93 4164.docx letter", async () => {
    const buffer = readFileSync(join(FIXTURES, "240 93 4164.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    const metadata = extractMetadata(paragraphs, "240 93 4164.docx")

    expect(detectImportKind(paragraphs, "240 93 4164.docx")).toBe("LETTER")
    expect(items).toHaveLength(16)
    expect(metadata.documentNumber).toBe("240/93/4164")

    const named = items.map((item) =>
      composeMeasureItemName({
        documentNumber: metadata.documentNumber,
        title: metadata.title,
        code: item.code,
        sortOrder: item.sortOrder,
      })
    )
    expect(named[0]).toBe("240/93/4164 · 1.1")

    expect(items.map((item) => item.code)).toEqual([
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",
      "1.8",
      "1.9",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ])

    const item8 = items.find((item) => item.code === "8")
    expect(item8?.description).toContain(
      "1e41c7bfaa6aa3b93b6cc024274a10e33f3e12fe7c98c1db387ef8927f9d1984"
    )
    expect(item8?.description).not.toContain("otd93@fstec.ru")
  })

  it("parses appendix fixture", async () => {
    const buffer = readFileSync(join(FIXTURES, "Приложение 240 93 4164.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    expect(detectImportKind(paragraphs, "Приложение 240 93 4164.docx")).toBe(
      "APPENDIX"
    )
    expect(parseMeasureItemsFromParagraphs(paragraphs)).toHaveLength(0)
  })

  it("parses 240 93 4165.docx with BDU codes", async () => {
    const buffer = readFileSync(join(FIXTURES, "240 93 4165.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    const metadata = extractMetadata(paragraphs, "240 93 4165.docx")

    expect(items).toHaveLength(5)
    expect(items.every((item) => item.code?.startsWith("BDU:"))).toBe(true)

    const second = items[1]
    expect(
      composeMeasureItemName({
        documentNumber: metadata.documentNumber,
        title: metadata.title,
        code: second?.code ?? null,
        sortOrder: second?.sortOrder,
      })
    ).toBe(`240/93/4165 · ${second?.code}`)
  })
})
