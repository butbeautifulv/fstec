import { describe, expect, it } from "vitest"
import { resolveLetterImportKind } from "@/lib/measure-imports/resolve-import-kind"

describe("resolveLetterImportKind", () => {
  it("keeps APPENDIX when no numbered items", () => {
    expect(
      resolveLetterImportKind({
        paragraphs: [],
        originalName: "Приложение 240 93 1409.docx",
        parentImportId: null,
        rawMeasureCount: 0,
      })
    ).toBe("APPENDIX")
  })

  it("treats mis-kind as LETTER when parser found measures", () => {
    expect(
      resolveLetterImportKind({
        paragraphs: ["SHA256: abc", "1. First measure"],
        originalName: "240 93 1000.docx",
        parentImportId: null,
        rawMeasureCount: 3,
      })
    ).toBe("LETTER")
  })

  it("keeps APPENDIX for child import", () => {
    expect(
      resolveLetterImportKind({
        paragraphs: ["1. rec"],
        originalName: "Приложение.docx",
        parentImportId: 5,
        rawMeasureCount: 1,
      })
    ).toBe("APPENDIX")
  })
})
