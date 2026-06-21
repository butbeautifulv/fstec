import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return { ...actual, cache: <T>(fn: T) => fn }
})

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
  get prismaRead() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrismaRead = mocks.prisma

vi.mock("@/lib/cache/json-cache", () => ({
  getCachedJson: vi.fn(async (_key, _ttl, fetcher: () => Promise<unknown>) => fetcher()),
}))

vi.mock("@/lib/order-items/fetch-detail", () => ({
  fetchOrderItemDetail: vi.fn(),
}))

import { fetchOrderItemDetail } from "@/lib/order-items/fetch-detail"
import {
  fetchPublicNavOrders,
  fetchPublicOrderSummaries,
  getOrderForToken,
  getPublicOrderItem,
  publicItemScopeWhere,
  validateAccessLink,
} from "@/lib/public/validate-token"

const activeLink = {
  id: 1,
  token: "valid-token",
  organizationId: 10,
  subdivisionId: 5,
  revokedAt: null,
  expiresAt: null,
  organization: { id: 10, name: "Org" },
  subdivision: { id: 5, name: "Sub" },
}

describe("publicItemScopeWhere", () => {
  it("scopes by organization only", () => {
    expect(publicItemScopeWhere({ organizationId: 10, subdivisionId: null })).toEqual({
      order: { organizationId: 10 },
    })
  })

  it("scopes by organization and subdivision", () => {
    expect(publicItemScopeWhere({ organizationId: 10, subdivisionId: 5 })).toEqual({
      order: { organizationId: 10 },
      subdivisionId: 5,
    })
  })
})

describe("validateAccessLink", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for missing link", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(null)
    expect(await validateAccessLink("missing")).toBeNull()
  })

  it("returns null for revoked link", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue({
      ...activeLink,
      revokedAt: new Date("2026-01-01"),
    })
    expect(await validateAccessLink("revoked")).toBeNull()
  })

  it("returns context for active link", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(activeLink)
    const ctx = await validateAccessLink("valid-token")
    expect(ctx?.organization.name).toBe("Org")
    expect(ctx?.link.token).toBe("valid-token")
  })
})

describe("getOrderForToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(activeLink)
  })

  it("returns null when token invalid", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(null)
    expect(await getOrderForToken("bad", 1)).toBeNull()
  })

  it("returns null when order has no scoped items", async () => {
    mockPrismaRead.order.findFirst.mockResolvedValue({ id: 1, items: [] })
    expect(await getOrderForToken("valid-token", 1)).toBeNull()
  })

  it("returns order with scoped items", async () => {
    mockPrismaRead.order.findFirst.mockResolvedValue({
      id: 1,
      items: [{ id: 100 }],
    })
    const result = await getOrderForToken("valid-token", 1)
    expect(result?.order.items).toHaveLength(1)
  })
})

describe("getPublicOrderItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(activeLink)
  })

  it("throws NOT_FOUND when token invalid", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(null)
    await expect(getPublicOrderItem("bad", 1)).rejects.toThrow("NOT_FOUND")
  })

  it("throws NOT_FOUND when item missing", async () => {
    vi.mocked(fetchOrderItemDetail).mockResolvedValue(null)
    await expect(getPublicOrderItem("valid-token", 1)).rejects.toThrow("NOT_FOUND")
  })

  it("returns item with context", async () => {
    vi.mocked(fetchOrderItemDetail).mockResolvedValue({ id: 1 } as never)
    const result = await getPublicOrderItem("valid-token", 1)
    expect(result.item.id).toBe(1)
    expect(result.organization.name).toBe("Org")
  })
})

describe("fetchPublicNavOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(activeLink)
  })

  it("returns null when token invalid", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(null)
    expect(await fetchPublicNavOrders("bad")).toBeNull()
  })

  it("groups scoped items by order", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      { id: 100, orderId: 1 },
      { id: 101, orderId: 1 },
      { id: 200, orderId: 2 },
    ])
    const result = await fetchPublicNavOrders("valid-token")
    expect(result?.navOrders).toEqual([
      { orderId: 1, items: [{ id: 100 }, { id: 101 }] },
      { orderId: 2, items: [{ id: 200 }] },
    ])
    expect(result?.organization.name).toBe("Org")
  })
})

describe("fetchPublicOrderSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(activeLink)
  })

  it("returns null when token invalid", async () => {
    mockPrismaRead.accessLink.findUnique.mockResolvedValue(null)
    expect(await fetchPublicOrderSummaries("bad")).toBeNull()
  })

  it("returns order summaries with item counts", async () => {
    mockPrismaRead.order.findMany.mockResolvedValue([
      {
        id: 1,
        title: "Order A",
        issuedAt: new Date("2026-01-01"),
        _count: { items: 2 },
      },
      {
        id: 2,
        title: "Order B",
        issuedAt: new Date("2026-01-02"),
        _count: { items: 0 },
      },
    ])
    const result = await fetchPublicOrderSummaries("valid-token")
    expect(result?.orders).toEqual([
      {
        id: 1,
        title: "Order A",
        issuedAt: new Date("2026-01-01"),
        itemCount: 2,
      },
    ])
  })
})
