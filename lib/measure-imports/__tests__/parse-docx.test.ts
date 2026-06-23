import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  classifyAppendixKind,
  detectImportKind,
  extractDocxParagraphsAsync,
  isAppendixDocument,
  isRecommendationsAppendix,
  parseMeasureItemsFromParagraphs,
} from "@/lib/measure-imports/parse-docx"
import { composeMeasureItemName, extractMetadata } from "@/lib/measure-imports/extract-metadata"

const FIXTURES = join(process.cwd(), ".external/docx_examples")
const CORPUS = join(FIXTURES, "corpus")
const hasFixtures = existsSync(join(FIXTURES, "240 93 4164.docx"))
const hasCorpus6837 = existsSync(join(CORPUS, "240 93 6837.docx"))

describe("classifyAppendixKind", () => {
  it("classifies recommendations appendix with numbered items", () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => `${i + 1}.1. Measure text`)
    expect(classifyAppendixKind(paragraphs, "Приложение 240 93 1409.docx")).toBe(
      "RECOMMENDATIONS"
    )
    expect(isRecommendationsAppendix(paragraphs, "Приложение 240 93 1409.docx")).toBe(
      true
    )
  })

  it("classifies IoC appendix by hashes", () => {
    const hashes = ["a".repeat(64), "b".repeat(64), "c".repeat(64)]
    expect(classifyAppendixKind(hashes, "Приложение.docx")).toBe("IOC")
  })
})

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

describe.skipIf(!hasCorpus6837)("corpus fixtures", () => {
  it("parses 240 93 6837 with composite splits", async () => {
    const buffer = readFileSync(join(CORPUS, "240 93 6837.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    expect(items.length).toBeGreaterThan(13)
    expect(items.some((i) => i.code?.startsWith("2."))).toBe(true)
    expect(items.map((i) => i.code)).toContain("1.6")
    expect(items.map((i) => i.code)).toContain("1.7")
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

  it("trims footer after compensating paragraphs in last numbered block", () => {
    const items = parseMeasureItemsFromParagraphs([
      "16. Уязвимость библиотеки axios (BDU:2026-05270, уровень опасности)",
      "В целях предотвращения рекомендуется установить обновление",
      "ограничить доступ к уязвимому программному обеспечению из внешних сетей.",
      "По результатам выполнения указанных рекомендаций просим проинформировать ФСТЭК России",
      "В случае направления данных рекомендаций подведомственным организациям, просим направлять их в редактируемом формате.",
    ])
    expect(items).toHaveLength(1)
    expect(items[0]?.code).toBe("BDU:2026-05270")
    expect(items[0]?.description).toContain("ограничить доступ")
    expect(items[0]?.description).not.toContain("По результатам выполнения")
    expect(items[0]?.description).not.toContain("редактируемом формате")
  })
})

const FULL_CORPUS = join(process.cwd(), ".external/240 93 6837")
const has2616 = existsSync(join(FULL_CORPUS, "240 93 2616/240 93 2616.docx"))

describe.skipIf(!has2616)("BDU letter footer (2616)", () => {
  it("parses 240 93 2616 without footer leak in measures", async () => {
    const buffer = readFileSync(join(FULL_CORPUS, "240 93 2616/240 93 2616.docx"))
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const items = parseMeasureItemsFromParagraphs(paragraphs)

    expect(items).toHaveLength(16)
    expect(
      items.every(
        (item) =>
          !/По результатам выполнения|просим проинформировать ФСТЭК|редактируемом формате/i.test(
            item.description
          )
      )
    ).toBe(true)
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
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    expect(detectImportKind(paragraphs, "Приложение 240 93 4164.docx")).toBe(
      "APPENDIX"
    )
    expect(items.length).toBeGreaterThanOrEqual(0)
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
