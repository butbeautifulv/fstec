import { describe, expect, it } from "vitest"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"

const ERROR_CASES: [string, number][] = [
  ["UNAUTHORIZED", 401],
  ["NOT_FOUND", 404],
  ["FORBIDDEN", 403],
  ["INVALID_TARGETS", 400],
  ["TARGETS_CONFLICT", 400],
  ["INVALID_MEASURES", 400],
  ["PRIMARY_CONTACT_EXISTS", 409],
  ["MEASURE_IN_USE", 409],
  ["ORG_HAS_ORDERS", 409],
  ["EMAIL_EXISTS", 409],
  ["LAST_SUPER_ADMIN", 409],
  ["CANNOT_DELETE_SELF", 409],
  ["USER_HAS_DATA", 409],
  ["INVALID_CURRENT_PASSWORD", 400],
  ["INVALID_MIME_TYPE", 400],
  ["INVALID_DOCX", 400],
  ["INVALID_FILE", 400],
  ["INVALID_PARENT_IMPORT", 400],
  ["IMPORT_INVALID_STATUS", 400],
  ["NO_ITEMS", 400],
  ["NO_ITEMS_FOUND", 400],
  ["INVALID_FILE_SIZE", 400],
  ["TOO_MANY_ATTACHMENTS", 400],
  ["INVALID_ATTACHMENTS", 400],
  ["INVALID_STATUS", 400],
  ["PENDING_EXISTS", 409],
  ["REVIEW_NOTE_REQUIRED", 400],
  ["S3_NOT_CONFIGURED", 503],
  ["S3 storage is not configured", 503],
]

describe("jsonOk/jsonError", () => {
  it("jsonOk returns data", async () => {
    const res = jsonOk({ ok: true })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it("jsonError returns message", async () => {
    const res = jsonError("bad", 422)
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: "bad" })
  })
})

describe("handleApiError", () => {
  it.each(ERROR_CASES)("maps %s to %i", async (code, status) => {
    const response = handleApiError(new Error(code))
    expect(response.status).toBe(status)
    const body = await response.json()
    expect(typeof body.error).toBe("string")
    expect(body.error.length).toBeGreaterThan(0)
  })

  it("maps unknown errors to 500", async () => {
    const response = handleApiError(new Error("SOMETHING_ELSE"))
    expect(response.status).toBe(500)
  })

  it("maps non-Error to 500", async () => {
    const response = handleApiError("string error")
    expect(response.status).toBe(500)
  })
})
