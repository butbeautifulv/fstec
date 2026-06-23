import { describe, expect, it } from "vitest"
import {
  isRoutingShellImport,
  resolveParseStatus,
} from "@/lib/measure-imports/resolve-parse-status"

describe("resolveParseStatus", () => {
  it("returns PARSED when items found", () => {
    expect(
      resolveParseStatus({
        parsedItemCount: 3,
        needsAppendix: false,
        parentImportId: null,
      })
    ).toEqual({ status: "PARSED", parseError: null })
  })

  it("returns PARSED for routing letter shell without items", () => {
    expect(
      resolveParseStatus({
        parsedItemCount: 0,
        needsAppendix: true,
        parentImportId: null,
      })
    ).toEqual({ status: "PARSED", parseError: null })
  })

  it("returns FAILED for empty appendix", () => {
    expect(
      resolveParseStatus({
        parsedItemCount: 0,
        needsAppendix: false,
        parentImportId: 12,
      })
    ).toEqual({ status: "FAILED", parseError: "NO_ITEMS_FOUND" })
  })

  it("returns FAILED for empty letter without appendix reference", () => {
    expect(
      resolveParseStatus({
        parsedItemCount: 0,
        needsAppendix: false,
        parentImportId: null,
      })
    ).toEqual({ status: "FAILED", parseError: "NO_ITEMS_FOUND" })
  })
})

describe("isRoutingShellImport", () => {
  it("detects routing shell in table", () => {
    expect(
      isRoutingShellImport({
        kind: "LETTER",
        status: "PARSED",
        needsAppendix: true,
        itemCount: 0,
        measureCount: 0,
      })
    ).toBe(true)
  })
})
