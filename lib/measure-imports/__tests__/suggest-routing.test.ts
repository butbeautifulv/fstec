import { describe, expect, it } from "vitest"
import { suggestRouting } from "@/lib/measure-imports/suggest-routing"

describe("suggestRouting", () => {
  it("suggests ДЦОД for network measures", () => {
    const result = suggestRouting({
      measureTags: ["network"],
      measureText: "сетевых средств защиты",
      subdivisions: [
        { id: 1, name: "ДЦОД" },
        { id: 2, name: "ДИТСБ" },
      ],
    })
    expect(result[0]?.subdivisionName).toBe("ДЦОД")
    expect(result[0]?.confidence).toBeGreaterThan(0.5)
  })

  it("suggests ДИТСБ for siem measures", () => {
    const result = suggestRouting({
      measureTags: ["siem"],
      measureText: "мониторинг событий",
      subdivisions: [
        { id: 1, name: "ДЦОД" },
        { id: 2, name: "ДИТСБ" },
      ],
    })
    expect(result[0]?.subdivisionName).toBe("ДИТСБ")
  })
})
