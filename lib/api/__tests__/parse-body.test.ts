import { describe, expect, it } from "vitest"
import { z } from "zod"
import { parseJsonBody } from "@/lib/api/parse-body"

const testSchema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
})

describe("parseJsonBody", () => {
  it("returns parsed data for valid body", async () => {
    const result = await parseJsonBody(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Test", count: 3 }),
      }),
      testSchema
    )
    expect(result).toEqual({ data: { name: "Test", count: 3 } })
  })

  it("returns error response for invalid body", async () => {
    const result = await parseJsonBody(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "", count: 0 }),
      }),
      testSchema
    )
    expect(result).toHaveProperty("error")
    if ("error" in result) {
      expect(result.error.status).toBeGreaterThanOrEqual(400)
    }
  })

  it("uses fallback message when zod issue message is missing", async () => {
    const emptyIssueSchema = z.object({
      value: z.string().refine(() => false),
    })
    const result = await parseJsonBody(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ value: "x" }),
      }),
      emptyIssueSchema
    )
    expect(result).toHaveProperty("error")
  })

  it("returns error response for invalid JSON", async () => {
    await expect(
      parseJsonBody(
        new Request("http://localhost", {
          method: "POST",
          body: "{not-json",
        }),
        testSchema
      )
    ).rejects.toThrow()
  })

  it("returns error response for empty body", async () => {
    await expect(
      parseJsonBody(
        new Request("http://localhost", {
          method: "POST",
          body: "",
        }),
        testSchema
      )
    ).rejects.toThrow()
  })
})
