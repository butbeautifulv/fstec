import { describe, expect, it } from "vitest"
import {
  isBoilerplateParagraph,
  shouldExpandComposites,
  splitCompositeBlock,
  stripThreatPreamble,
} from "@/lib/measure-imports/parse-composite"

describe("parse-composite", () => {
  it("detects boilerplate paragraphs", () => {
    expect(
      isBoilerplateParagraph(
        "Хакерскими группировками, нацеленными на органы государственной власти"
      )
    ).toBe(true)
    expect(
      isBoilerplateParagraph(
        "Для предотвращения реализации угроз безопасности информации, связанных с деятельностью указанных хакерских группировок по фишинговым рассылкам, необходимо реализовать меры защиты, указанные в пунктах 1.1-1.5."
      )
    ).toBe(true)
    expect(
      isBoilerplateParagraph(
        "Кроме того, необходимо обеспечить на уровне сетевых средств защиты"
      )
    ).toBe(false)
  })

  it("strips threat preamble from block body", () => {
    const cleaned = stripThreatPreamble([
      "Хакерскими группировками…",
      "Кроме того, необходимо обеспечить блокировку",
    ])
    expect(cleaned).toHaveLength(1)
    expect(cleaned[0]).toContain("Кроме того")
  })

  it("enables composite expansion for 6837-style section 1", () => {
    const blocks6837 = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "2"].map(
      (code) => ({ code, paragraphs: [`${code}. text`] })
    )
    expect(shouldExpandComposites(blocks6837)).toBe(true)

    const blocks4164 = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2"].map(
      (code) => ({ code, paragraphs: [`${code}. text`] })
    )
    expect(shouldExpandComposites(blocks4164)).toBe(false)
  })

  it("splits composite block 2 into sub-blocks", () => {
    const parts = splitCompositeBlock({
      code: "2",
      paragraphs: [
        "2. Хакерскими группировками…",
        "Для предотвращения… реализовать меры 1.1-1.5.",
        "Кроме того, необходимо обеспечить на уровне сетевых средств защиты информации ограничение обращений к IP-адресу 2[.]59[.]161[.]42.",
        "Также необходимо осуществить настройку правил системы мониторинга событий информационной безопасности",
      ],
    })
    expect(parts.length).toBeGreaterThanOrEqual(2)
    expect(parts.some((p) => p.code.startsWith("2"))).toBe(true)
    expect(parts.some((p) => p.paragraphs.join(" ").includes("Кроме того"))).toBe(true)
  })
})
