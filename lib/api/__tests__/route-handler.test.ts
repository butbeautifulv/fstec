import { describe, expect, it, vi } from "vitest"
import { cronRoute, parseOptionalIntParam, parseRouteId } from "@/lib/api/route-handler"

vi.mock("@/lib/cron/auth", () => ({
  assertCronSecret: vi.fn(),
}))

vi.mock("@/lib/email/config", () => ({
  getCronSecret: vi.fn(() => "secret"),
}))

import { assertCronSecret } from "@/lib/cron/auth"

describe("parseRouteId", () => {
  it("parses valid numeric id", () => {
    expect(parseRouteId("42")).toBe(42)
  })

  it("throws NOT_FOUND for invalid id", () => {
    expect(() => parseRouteId("abc")).toThrow("NOT_FOUND")
    expect(() => parseRouteId("NaN")).toThrow("NOT_FOUND")
  })
})

describe("parseOptionalIntParam", () => {
  it("returns undefined for absent param", () => {
    expect(parseOptionalIntParam(undefined)).toBeUndefined()
  })

  it("returns undefined for array param", () => {
    expect(parseOptionalIntParam(["1", "2"])).toBeUndefined()
  })

  it("parses valid integer string", () => {
    expect(parseOptionalIntParam("15")).toBe(15)
  })

  it("returns undefined for non-numeric string", () => {
    expect(parseOptionalIntParam("abc")).toBeUndefined()
  })
})

describe("cronRoute", () => {
  it("returns handler result on success", async () => {
    vi.mocked(assertCronSecret).mockImplementation(() => {})
    const route = cronRoute(async () => ({ ok: true }))
    const res = await route(
      new Request("http://localhost", {
        headers: { authorization: "Bearer secret" },
      })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it("returns 403 when cron secret invalid", async () => {
    vi.mocked(assertCronSecret).mockImplementation(() => {
      throw new Error("FORBIDDEN")
    })
    const route = cronRoute(async () => ({ ok: true }))
    const res = await route(new Request("http://localhost"))
    expect(res.status).toBe(403)
  })
})
