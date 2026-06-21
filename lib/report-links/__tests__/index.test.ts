import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const fetchOrderItemDetailById = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/order-items/fetch-detail", () => ({ fetchOrderItemDetailById }))

import {
  createReportLink,
  getActiveReportLink,
  listReportLinks,
  revokeReportLink,
} from "@/lib/report-links/index"
import {
  getOrderForReportToken,
  getOrderItemForReportToken,
  getOrganizationOrdersForReportToken,
  validateReportToken,
} from "@/lib/report-links/validate-token"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

const globalLink = {
  id: 1,
  token: "valid-token",
  organizationId: null,
  subdivisionId: null,
  revokedAt: null,
  expiresAt: new Date("2027-01-01"),
}

const orgLink = {
  id: 2,
  token: "org-token",
  organizationId: 5,
  subdivisionId: null,
  revokedAt: null,
  expiresAt: new Date("2027-01-01"),
}

describe("report-links index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.reportLink.create.mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      token: "new-report-token",
      organizationId: null,
      subdivisionId: null,
      ...(args.data as object),
    }))
  })

  it("createReportLink revokes active links for scope and creates new", async () => {
    const link = await createReportLink({ type: "organization", organizationId: 5 })
    expect(mockPrisma.reportLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 5,
          subdivisionId: null,
          revokedAt: null,
        }),
      })
    )
    expect(link.token).toBeTruthy()
  })

  it("createReportLink defaults to global scope", async () => {
    await createReportLink()
    expect(mockPrisma.reportLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: null,
          subdivisionId: null,
        }),
      })
    )
  })

  it("revokeReportLink updates link", async () => {
    mockPrisma.reportLink.update.mockResolvedValue({ id: 2 })
    await expect(revokeReportLink(2)).resolves.toEqual({ id: 2 })
  })

  it("getActiveReportLink returns first active link for scope", async () => {
    mockPrisma.reportLink.findMany.mockResolvedValue([
      { id: 1, revokedAt: new Date(), expiresAt: null, organizationId: 5, subdivisionId: null },
      orgLink,
    ])
    await expect(getActiveReportLink({ type: "organization", organizationId: 5 })).resolves.toEqual(
      orgLink
    )
  })

  it("getActiveReportLink returns null when none active", async () => {
    mockPrisma.reportLink.findMany.mockResolvedValue([
      { id: 1, revokedAt: new Date(), expiresAt: null, organizationId: null, subdivisionId: null },
    ])
    await expect(getActiveReportLink()).resolves.toBeNull()
  })

  it("listReportLinks returns all links", async () => {
    mockPrisma.reportLink.findMany.mockResolvedValue([{ id: 1 }])
    await expect(listReportLinks()).resolves.toHaveLength(1)
  })
})

describe("validateReportToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for missing token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(validateReportToken("bad")).resolves.toBeNull()
  })

  it("returns null for revoked token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue({
      token: "bad",
      organizationId: null,
      subdivisionId: null,
      revokedAt: new Date(),
      expiresAt: null,
    })
    await expect(validateReportToken("bad")).resolves.toBeNull()
  })

  it("returns link context with scope for valid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(globalLink)
    await expect(validateReportToken("valid-token")).resolves.toEqual({
      link: globalLink,
      scope: { type: "global" },
    })
  })

  it("getOrderItemForReportToken throws NOT_FOUND for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrderItemForReportToken("bad", 1)).rejects.toThrow("NOT_FOUND")
  })

  it("getOrderItemForReportToken throws NOT_FOUND when item outside scope", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(orgLink)
    fetchOrderItemDetailById.mockResolvedValue({
      id: 5,
      subdivisionId: 12,
      order: { organization: { id: 99 } },
    })
    await expect(getOrderItemForReportToken("org-token", 5)).rejects.toThrow("NOT_FOUND")
  })

  it("getOrderItemForReportToken returns link and item in scope", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(orgLink)
    fetchOrderItemDetailById.mockResolvedValue({
      id: 5,
      subdivisionId: 12,
      order: { organization: { id: 5 } },
    })
    const result = await getOrderItemForReportToken("org-token", 5)
    expect(result.item.id).toBe(5)
    expect(result.scope.type).toBe("organization")
  })

  it("getOrderForReportToken returns null for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrderForReportToken("bad", 1)).resolves.toBeNull()
  })

  it("getOrderForReportToken returns null when order empty", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(globalLink)
    mockPrisma.order.findUnique.mockResolvedValue({ id: 1, organizationId: 5, items: [] })
    await expect(getOrderForReportToken("valid-token", 1)).resolves.toBeNull()
  })

  it("getOrderForReportToken returns order with items", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(globalLink)
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 5,
      items: [{ id: 10, subdivisionId: null }],
    })
    const result = await getOrderForReportToken("valid-token", 1)
    expect(result?.order.items).toHaveLength(1)
  })

  it("getOrganizationOrdersForReportToken returns null for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrganizationOrdersForReportToken("bad", 1)).resolves.toBeNull()
  })

  it("getOrganizationOrdersForReportToken returns null when org outside scope", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(orgLink)
    await expect(getOrganizationOrdersForReportToken("org-token", 99)).resolves.toBeNull()
  })

  it("getOrganizationOrdersForReportToken returns org and orders", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(globalLink)
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 1, name: "Org" })
    mockPrisma.order.findMany.mockResolvedValue([{ id: 10 }])
    const result = await getOrganizationOrdersForReportToken("valid-token", 1)
    expect(result).toEqual({
      link: globalLink,
      scope: { type: "global" },
      organization: { id: 1, name: "Org" },
      orders: [{ id: 10 }],
    })
  })
})
