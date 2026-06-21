import { describe, expect, it } from "vitest"
import { dedupeAndSortContacts, getContactsListWhere } from "@/lib/contacts"

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
})

describe("dedupeAndSortContacts", () => {
  it("dedupes emails case-insensitively with trim", () => {
    const result = dedupeAndSortContacts([
      {
        email: "  User@Example.com ",
        role: "NOTIFY",
        fullName: "B User",
      },
      {
        email: "user@example.com",
        role: "PRIMARY",
        fullName: "A Primary",
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.email).toBe("  User@Example.com ")
  })

  it("sorts by role order then full name", () => {
    const result = dedupeAndSortContacts([
      { email: "b@test.com", role: "NOTIFY", fullName: "Zeta" },
      { email: "a@test.com", role: "PRIMARY", fullName: "Alpha" },
      { email: "c@test.com", role: "RESPONSIBLE", fullName: "Beta" },
    ])
    expect(result.map((c) => c.fullName)).toEqual(["Alpha", "Beta", "Zeta"])
  })

  it("sorts alphabetically within the same role", () => {
    const result = dedupeAndSortContacts([
      { email: "b@test.com", role: "NOTIFY", fullName: "Zeta" },
      { email: "a@test.com", role: "NOTIFY", fullName: "Alpha" },
    ])
    expect(result.map((c) => c.fullName)).toEqual(["Alpha", "Zeta"])
  })

  it("keeps first contact when duplicate email appears later", () => {
    const first = { email: "dup@test.com", role: "PRIMARY" as const, fullName: "First" }
    const second = { email: "dup@test.com", role: "NOTIFY" as const, fullName: "Second" }
    const result = dedupeAndSortContacts([first, second])
    expect(result).toEqual([first])
  })
})
