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

const activeLink = {
  id: 1,
  token: "valid-token",
  revokedAt: null,
  expiresAt: new Date("2027-01-01"),
}

describe("report-links index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.reportLink.create.mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      token: "new-report-token",
      ...(args.data as object),
    }))
  })

  it("createReportLink revokes active links and creates new", async () => {
    const link = await createReportLink()
    expect(mockPrisma.reportLink.updateMany).toHaveBeenCalled()
    expect(link.token).toBeTruthy()
  })

  it("revokeReportLink updates link", async () => {
    mockPrisma.reportLink.update.mockResolvedValue({ id: 2 })
    await expect(revokeReportLink(2)).resolves.toEqual({ id: 2 })
  })

  it("getActiveReportLink returns first active link", async () => {
    mockPrisma.reportLink.findMany.mockResolvedValue([
      { id: 1, revokedAt: new Date(), expiresAt: null },
      activeLink,
    ])
    await expect(getActiveReportLink()).resolves.toEqual(activeLink)
  })

  it("getActiveReportLink returns null when none active", async () => {
    mockPrisma.reportLink.findMany.mockResolvedValue([
      { id: 1, revokedAt: new Date(), expiresAt: null },
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
      revokedAt: new Date(),
      expiresAt: null,
    })
    await expect(validateReportToken("bad")).resolves.toBeNull()
  })

  it("returns link context for valid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    await expect(validateReportToken("valid-token")).resolves.toEqual({ link: activeLink })
  })

  it("getOrderItemForReportToken throws NOT_FOUND for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrderItemForReportToken("bad", 1)).rejects.toThrow("NOT_FOUND")
  })

  it("getOrderItemForReportToken throws NOT_FOUND when item missing", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    fetchOrderItemDetailById.mockResolvedValue(null)
    await expect(getOrderItemForReportToken("valid-token", 1)).rejects.toThrow("NOT_FOUND")
  })

  it("getOrderItemForReportToken returns link and item", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    fetchOrderItemDetailById.mockResolvedValue({ id: 5 })
    const result = await getOrderItemForReportToken("valid-token", 5)
    expect(result).toEqual({ link: activeLink, item: { id: 5 } })
  })

  it("getOrderForReportToken returns null for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrderForReportToken("bad", 1)).resolves.toBeNull()
  })

  it("getOrderForReportToken returns null when order empty", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    mockPrisma.order.findUnique.mockResolvedValue({ id: 1, items: [] })
    await expect(getOrderForReportToken("valid-token", 1)).resolves.toBeNull()
  })

  it("getOrderForReportToken returns order with items", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    mockPrisma.order.findUnique.mockResolvedValue({ id: 1, items: [{ id: 10 }] })
    const result = await getOrderForReportToken("valid-token", 1)
    expect(result?.order.items).toHaveLength(1)
  })

  it("getOrganizationOrdersForReportToken returns null for invalid token", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(null)
    await expect(getOrganizationOrdersForReportToken("bad", 1)).resolves.toBeNull()
  })

  it("getOrganizationOrdersForReportToken returns null when org missing", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    mockPrisma.organization.findUnique.mockResolvedValue(null)
    await expect(
      getOrganizationOrdersForReportToken("valid-token", 1)
    ).resolves.toBeNull()
  })

  it("getOrganizationOrdersForReportToken returns org and orders", async () => {
    mockPrisma.reportLink.findUnique.mockResolvedValue(activeLink)
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 1, name: "Org" })
    mockPrisma.order.findMany.mockResolvedValue([{ id: 10 }])
    const result = await getOrganizationOrdersForReportToken("valid-token", 1)
    expect(result).toEqual({
      link: activeLink,
      organization: { id: 1, name: "Org" },
      orders: [{ id: 10 }],
    })
  })
})
