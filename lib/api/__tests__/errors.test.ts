import { describe, expect, it } from "vitest"
import { handleApiError } from "@/lib/api/errors"

describe("handleApiError", () => {
  it("maps TARGETS_CONFLICT to 400", async () => {
    const response = handleApiError(new Error("TARGETS_CONFLICT"))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("подразделение")
  })
})
