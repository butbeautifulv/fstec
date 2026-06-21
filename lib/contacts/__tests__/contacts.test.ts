import { describe, expect, it } from "vitest"
import { handleApiError } from "@/lib/api/errors"
import { getContactsListWhere } from "@/lib/contacts"

describe("contacts", () => {
  it("getContactsListWhere for organization scope", () => {
    expect(getContactsListWhere({ organizationId: 7 })).toEqual({
      organizationId: 7,
      subdivisionId: null,
    })
  })

  it("getContactsListWhere for subdivision scope", () => {
    expect(getContactsListWhere({ subdivisionId: 12 })).toEqual({
      subdivisionId: 12,
    })
  })

  it("maps PRIMARY_CONTACT_EXISTS to 409", async () => {
    const response = handleApiError(new Error("PRIMARY_CONTACT_EXISTS"))
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain("Главный ответственный")
  })
})
