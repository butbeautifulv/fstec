import { describe, expect, it } from "vitest"
import {
  canonicalAppendixFileName,
  isCanonicalAppendixFile,
  isJunkAppendixFile,
  pickCanonicalAppendixFile,
} from "@/lib/measure-imports/canonical-appendix"

describe("canonical appendix files", () => {
  it("accepts default FSTEC appendix names", () => {
    expect(isCanonicalAppendixFile("Приложение 240 93 998.docx")).toBe(true)
    expect(isCanonicalAppendixFile("Приложение 240 93 7784.docx")).toBe(true)
  })

  it("rejects DZO split appendices", () => {
    expect(isCanonicalAppendixFile("Приложение 240 93 7784 ДИТСБ.docx")).toBe(false)
    expect(isCanonicalAppendixFile("Приложение 1581 ДКИТИ.docx")).toBe(false)
    expect(isCanonicalAppendixFile("Приложение — ДЦОД.docx")).toBe(false)
  })

  it("marks non-canonical appendix uploads as junk", () => {
    expect(isJunkAppendixFile("Приложение 240 93 7784 ДИТСБ.docx")).toBe(true)
    expect(isJunkAppendixFile("Приложение 240 93 998.docx")).toBe(false)
    expect(isJunkAppendixFile("240 93 998.docx")).toBe(false)
  })

  it("picks only canonical file from folder listing", () => {
    const files = [
      "240 93 7784.docx",
      "Приложение 240 93 7784 ДИТСБ.docx",
      "Приложение 240 93 7784.docx",
    ]
    expect(pickCanonicalAppendixFile(files, "240 93 7784")).toBe(
      canonicalAppendixFileName("7784")
    )
  })

  it("returns null when only DZO splits exist", () => {
    const files = ["240 93 1713.docx", "Приложение 240 93 1713 ДКИТИ.docx"]
    expect(pickCanonicalAppendixFile(files, "240 93 1713")).toBeNull()
  })
})
