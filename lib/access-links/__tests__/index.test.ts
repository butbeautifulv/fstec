import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const invalidateKeys = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/cache/json-cache", () => ({ invalidateKeys }))

import {
  createOrganizationAccessLink,
  createSubdivisionAccessLink,
  ensurePortalLink,
  getActiveOrgLink,
  getActiveSubdivisionLink,
  getOrganizationLinks,
  revokeAccessLink,
} from "@/lib/access-links"
import { revokeAccessLinkFromRequest } from "@/lib/access-links/revoke-from-request"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

describe("access-links", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.accessLink.findMany.mockResolvedValue([])
    mockPrisma.accessLink.create.mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      token: "new-token",
      ...(args.data as object),
    }))
    mockPrisma.accessLink.update.mockResolvedValue({ id: 2, token: "revoked-token" })
  })

  describe("createOrganizationAccessLink", () => {
    it("revokes active links and creates org link", async () => {
      mockPrisma.accessLink.findMany.mockResolvedValue([{ token: "old-token" }])
      const link = await createOrganizationAccessLink(5)

      expect(link.organizationId).toBe(5)
      expect(mockPrisma.accessLink.updateMany).toHaveBeenCalled()
      expect(invalidateKeys).toHaveBeenCalledWith("access-link:old-token")
    })
  })

  describe("createSubdivisionAccessLink", () => {
    it("creates link for subdivision", async () => {
      mockPrisma.subdivision.findUniqueOrThrow.mockResolvedValue({
        id: 10,
        organizationId: 5,
      })

      const link = await createSubdivisionAccessLink(10)

      expect(link.subdivisionId).toBe(10)
      expect(link.organizationId).toBe(5)
    })
  })

  describe("revokeAccessLink", () => {
    it("revokes link and invalidates cache", async () => {
      await revokeAccessLink(3)
      expect(mockPrisma.accessLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 3 } })
      )
      expect(invalidateKeys).toHaveBeenCalledWith("access-link:revoked-token")
    })
  })

  describe("getOrganizationLinks", () => {
    it("lists links for organization", async () => {
      mockPrisma.accessLink.findMany.mockResolvedValue([{ id: 1 }])
      const links = await getOrganizationLinks(5)
      expect(links).toHaveLength(1)
    })
  })

  describe("getActiveOrgLink / getActiveSubdivisionLink", () => {
    it("finds active org link", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue({ id: 1 })
      await expect(getActiveOrgLink(5)).resolves.toEqual({ id: 1 })
    })

    it("finds active subdivision link", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue({ id: 2 })
      await expect(getActiveSubdivisionLink(10)).resolves.toEqual({ id: 2 })
    })
  })

  describe("ensurePortalLink", () => {
    it("returns existing org link", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue({ id: 1, token: "existing" })
      const link = await ensurePortalLink({ organizationId: 5, subdivisionId: null })
      expect(link).toEqual({ id: 1, token: "existing" })
      expect(mockPrisma.accessLink.create).not.toHaveBeenCalled()
    })

    it("creates org link when none active", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue(null)
      const link = await ensurePortalLink({ organizationId: 5, subdivisionId: null })
      expect(link.organizationId).toBe(5)
    })

    it("returns existing subdivision link", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue({ id: 3 })
      const link = await ensurePortalLink({ organizationId: 5, subdivisionId: 10 })
      expect(link).toEqual({ id: 3 })
    })

    it("creates subdivision link when none active", async () => {
      mockPrisma.accessLink.findFirst.mockResolvedValue(null)
      mockPrisma.subdivision.findUniqueOrThrow.mockResolvedValue({
        id: 10,
        organizationId: 5,
      })
      const link = await ensurePortalLink({ organizationId: 5, subdivisionId: 10 })
      expect(link.subdivisionId).toBe(10)
    })
  })

  describe("revokeAccessLinkFromRequest", () => {
    it("throws when linkId missing", async () => {
      const request = new Request("http://localhost/api?linkId=")
      await expect(revokeAccessLinkFromRequest(request)).rejects.toThrow("linkId required")
    })

    it("revokes link from query param", async () => {
      const request = new Request("http://localhost/api?linkId=42")
      const linkId = await revokeAccessLinkFromRequest(request)
      expect(linkId).toBe(42)
      expect(mockPrisma.accessLink.update).toHaveBeenCalled()
    })
  })
})
