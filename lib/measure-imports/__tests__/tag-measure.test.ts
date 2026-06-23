import { describe, expect, it } from "vitest"
import { tagMeasure } from "@/lib/measure-imports/tag-measure"

describe("tagMeasure", () => {
  it("tags network measures", () => {
    const tags = tagMeasure(
      "Обеспечить на уровне сетевых средств защиты информации ограничение обращений",
      "1.6"
    )
    expect(tags).toContain("network")
  })

  it("tags siem measures", () => {
    const tags = tagMeasure(
      "Осуществить настройку правил системы мониторинга событий информационной безопасности",
      "1.7"
    )
    expect(tags).toContain("siem")
  })

  it("tags BDU vulnerability", () => {
    const tags = tagMeasure("Уязвимость BDU:2025-09471 критическая", null)
    expect(tags).toContain("vulnerability")
  })
})
