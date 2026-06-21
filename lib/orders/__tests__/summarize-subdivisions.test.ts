import { describe, expect, it } from "vitest"
import { summarizeOrderSubdivisions } from "@/lib/orders/summarize-subdivisions"

describe("summarizeOrderSubdivisions", () => {
  it("returns null when no subdivisions assigned", () => {
    expect(
      summarizeOrderSubdivisions([
        { subdivision: null },
        { subdivision: null },
      ])
    ).toBeNull()
  })

  it("returns single subdivision name", () => {
    expect(
      summarizeOrderSubdivisions([
        { subdivision: { name: "IT" } },
        { subdivision: { name: "IT" } },
      ])
    ).toBe("IT")
  })

  it("returns comma-separated unique names sorted", () => {
    expect(
      summarizeOrderSubdivisions([
        { subdivision: { name: "Бухгалтерия" } },
        { subdivision: { name: "IT" } },
        { subdivision: { name: "IT" } },
      ])
    ).toBe("Бухгалтерия, IT")
  })
})
