import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/public-guard", () => ({
  assertPublicRateLimit: vi.fn(),
}))

vi.mock("@/lib/public/validate-token", () => ({
  getPublicOrderItem: vi.fn(),
}))

import { assertPublicRateLimit } from "@/lib/api/public-guard"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { guardPublicOrderItemWrite } from "@/lib/public/guard-order-item-write"

describe("guardPublicOrderItemWrite", () => {
  it("returns rate limit error", async () => {
    const rateResponse = new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
    })
    vi.mocked(assertPublicRateLimit).mockResolvedValue(rateResponse)

    const result = await guardPublicOrderItemWrite(
      new Request("http://localhost"),
      "token",
      "1"
    )
    expect(result.error).toBe(rateResponse)
  })

  it("returns link and item on success", async () => {
    vi.mocked(assertPublicRateLimit).mockResolvedValue(null)
    vi.mocked(getPublicOrderItem).mockResolvedValue({
      link: { token: "token" },
      item: { id: 5 },
    } as never)

    const result = await guardPublicOrderItemWrite(
      new Request("http://localhost"),
      "token",
      "5"
    )
    expect(result).toEqual({
      link: { token: "token" },
      item: { id: 5 },
      orderItemId: 5,
    })
    expect(assertPublicRateLimit).toHaveBeenCalledWith(
      expect.any(Request),
      "token",
      "write"
    )
  })
})
