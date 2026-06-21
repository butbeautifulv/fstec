import { describe, expect, it } from "vitest"
import { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"

describe("BatchCreateValidationError", () => {
  it("sets name and message", () => {
    const error = new BatchCreateValidationError("INVALID_TARGETS")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("BatchCreateValidationError")
    expect(error.message).toBe("INVALID_TARGETS")
  })
})
