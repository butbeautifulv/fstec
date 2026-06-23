import { describe, expect, it } from "vitest"
import {
  appendixMeasureName,
  composeMeasureItemName,
  defaultOrderTitle,
  extractDocumentNumber,
  extractMetadata,
  extractReportDueAt,
  extractTitle,
} from "@/lib/measure-imports/extract-metadata"

const TITLE =
  "О мерах по повышению защищенности информационной инфраструктуры"

describe("extractDocumentNumber", () => {
  it("parses space-separated filename", () => {
    expect(extractDocumentNumber([], "240 93 4164.docx")).toBe("240/93/4164")
  })

  it("parses slash format in filename", () => {
    expect(extractDocumentNumber([], "letter-240/93/4165.docx")).toBe("240/93/4165")
  })

  it("reads number from paragraph text", () => {
    const paragraphs = ["Информационное сообщение № 240/93/4164 от 01.01.2025"]
    expect(extractDocumentNumber(paragraphs, "doc.docx")).toBe("240/93/4164")
  })

  it("returns null when no number found", () => {
    expect(extractDocumentNumber(["Hello"], "report.docx")).toBeNull()
  })
})

describe("extractTitle", () => {
  it("finds standard FSTEC title paragraph", () => {
    const paragraphs = ["240/93/4164", `${TITLE} объектов критической информационной инфраструктуры`]
    expect(extractTitle(paragraphs)).toMatch(TITLE)
  })

  it("returns null when title absent", () => {
    expect(extractTitle(["Произвольный текст"])).toBeNull()
  })
})

describe("extractReportDueAt", () => {
  it("parses Russian due date", () => {
    const date = extractReportDueAt([
      "Представить отчёт до 15 марта 2026 года",
    ])
    expect(date?.toISOString()).toBe("2026-03-15T12:00:00.000Z")
  })

  it("returns null for invalid month", () => {
    expect(extractReportDueAt(["до 1 foo 2026"])).toBeNull()
  })

  it("returns null when no due phrase", () => {
    expect(extractReportDueAt(["Срок не указан"])).toBeNull()
  })

  it("parses due date from FSTEC report footer (2616)", () => {
    const date = extractReportDueAt([
      "По результатам выполнения указанных рекомендаций просим проинформировать ФСТЭК России по адресу электронной почты otd93@fstec.ru до 20 июня 2026 г. в форме письма с электронным вложением",
    ])
    expect(date?.toISOString()).toBe("2026-06-20T12:00:00.000Z")
  })
})

describe("extractMetadata", () => {
  it("combines letter document fields", () => {
    const paragraphs = [
      "Информационное сообщение № 240/93/4164",
      `${TITLE} объектов`,
      "Представить отчёт до 1 июня 2026 года",
    ]
    const meta = extractMetadata(paragraphs, "240 93 4164.docx")
    expect(meta.documentNumber).toBe("240/93/4164")
    expect(meta.title).toMatch(TITLE)
    expect(meta.reportDueAt?.getUTCFullYear()).toBe(2026)
  })

  it("sets needsAppendix when routing letter references appendix", () => {
    const meta = extractMetadata(
      ["Приложение: Рекомендации на 6 л."],
      "240 93 1409.docx",
      0
    )
    expect(meta.needsAppendix).toBe(true)
  })
})

describe("defaultOrderTitle", () => {
  it("uses document number when available", () => {
    expect(defaultOrderTitle("240/93/4164", null)).toBe(
      "Поручение по письму 240/93/4164"
    )
  })

  it("falls back to generic title", () => {
    expect(defaultOrderTitle(null, null)).toBe("Поручение по документу ФСТЭК")
  })

  it("uses document number when both number and title exist", () => {
    expect(defaultOrderTitle("240/93/4164", "Some title")).toBe(
      "Поручение по письму 240/93/4164"
    )
  })
})

describe("appendixMeasureName", () => {
  it("includes document number", () => {
    expect(appendixMeasureName("240/93/4164")).toContain("240/93/4164")
  })

  it("works without number", () => {
    expect(appendixMeasureName(null)).toBe(
      "Проверить файловые индикаторы (приложение)"
    )
  })
})

describe("composeMeasureItemName", () => {
  it("prefers document number prefix", () => {
    expect(
      composeMeasureItemName({
        documentNumber: "240/93/4164",
        title: TITLE,
        code: "1.1",
      })
    ).toBe("240/93/4164 · 1.1")
  })

  it("truncates long title", () => {
    const longTitle = "А".repeat(100)
    const name = composeMeasureItemName({
      documentNumber: null,
      title: longTitle,
      code: null,
      sortOrder: 0,
    })
    expect(name.length).toBeLessThan(longTitle.length + 10)
    expect(name).toContain("…")
  })

  it("falls back to sort order index", () => {
    expect(
      composeMeasureItemName({
        documentNumber: null,
        title: null,
        code: null,
        sortOrder: 2,
      })
    ).toBe("Мера · #3")
  })
})
