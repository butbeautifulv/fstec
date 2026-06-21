import { describe, expect, it } from "vitest"
import { assertImportEditableStatus } from "@/lib/measure-imports/status"

describe("assertImportEditableStatus", () => {
  it("allows PARSED and IMPORTED", () => {
    expect(() => assertImportEditableStatus("PARSED")).not.toThrow()
    expect(() => assertImportEditableStatus("IMPORTED")).not.toThrow()
  })

  it("rejects other statuses", () => {
    expect(() => assertImportEditableStatus("UPLOADED")).toThrow("IMPORT_INVALID_STATUS")
    expect(() => assertImportEditableStatus("FAILED")).toThrow("IMPORT_INVALID_STATUS")
  })
})
