import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockRequirePermission = vi.hoisted(() => vi.fn())
const mockListContacts = vi.hoisted(() => vi.fn())
const mockCreateContact = vi.hoisted(() => vi.fn())
const mockGetSubdivision = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("@/lib/auth/session", () => ({
  requirePermission: mockRequirePermission,
}))

vi.mock("@/lib/contacts", () => ({
  listContacts: mockListContacts,
  createContact: mockCreateContact,
}))

vi.mock("@/lib/organizations", () => ({
  getSubdivision: mockGetSubdivision,
}))

mocks.prisma = createMockPrisma()

import { createContactCollectionHandlers } from "@/lib/contacts/route-handlers"

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("createContactCollectionHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue(undefined)
  })

  describe("org scope", () => {
    const { GET, POST } = createContactCollectionHandlers("org")

    it("GET lists organization contacts", async () => {
      mockListContacts.mockResolvedValue([{ id: 1, fullName: "Alice" }])
      const response = await GET(new Request("http://localhost"), routeContext("3"))
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([{ id: 1, fullName: "Alice" }])
      expect(mockListContacts).toHaveBeenCalledWith({ organizationId: 3 })
    })

    it("POST creates organization contact", async () => {
      mockCreateContact.mockResolvedValue({ id: 2, fullName: "Bob" })
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: "Bob",
            email: "bob@test.com",
            role: "RESPONSIBLE",
          }),
        }),
        routeContext("3")
      )
      expect(response.status).toBe(201)
      expect(mockCreateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 3,
          subdivisionId: null,
          fullName: "Bob",
        })
      )
    })

    it("GET returns 401 when unauthorized", async () => {
      mockRequirePermission.mockRejectedValue(new Error("UNAUTHORIZED"))
      const response = await GET(new Request("http://localhost"), routeContext("1"))
      expect(response.status).toBe(401)
    })

    it("POST returns error when createContact throws", async () => {
      mockCreateContact.mockRejectedValue(new Error("EMAIL_EXISTS"))
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: "Bob",
            email: "bob@test.com",
            role: "RESPONSIBLE",
          }),
        }),
        routeContext("3")
      )
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe("subdivision scope", () => {
    const { GET, POST } = createContactCollectionHandlers("subdivision")

    it("GET lists subdivision contacts", async () => {
      mockListContacts.mockResolvedValue([])
      await GET(new Request("http://localhost"), routeContext("10"))
      expect(mockListContacts).toHaveBeenCalledWith({ subdivisionId: 10 })
    })

    it("POST resolves organization from subdivision", async () => {
      mockGetSubdivision.mockResolvedValue({ id: 10, organizationId: 3 })
      mockCreateContact.mockResolvedValue({ id: 1 })
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: "Carol",
            email: "carol@test.com",
            role: "PRIMARY",
          }),
        }),
        routeContext("10")
      )
      expect(response.status).toBe(201)
      expect(mockCreateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 3,
          subdivisionId: 10,
        })
      )
    })

    it("POST returns 404 when subdivision missing", async () => {
      mockGetSubdivision.mockResolvedValue(null)
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: "Carol",
            email: "carol@test.com",
            role: "PRIMARY",
          }),
        }),
        routeContext("99")
      )
      expect(response.status).toBe(404)
    })
  })
})
