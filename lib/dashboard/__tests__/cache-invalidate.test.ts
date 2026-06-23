import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetCachedJson = vi.hoisted(() => vi.fn())
const mockGetScopedDashboard = vi.hoisted(() => vi.fn())
const mockInvalidateKeys = vi.hoisted(() => vi.fn())
const mockGetDashboardCacheTtl = vi.hoisted(() => vi.fn())

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return { ...actual, cache: <T>(fn: T) => fn }
})

vi.mock("@/lib/cache/json-cache", () => ({
  getCachedJson: mockGetCachedJson,
  invalidateKeysByPrefix: mockInvalidateKeys,
}))

vi.mock("@/lib/cache/redis", () => ({
  getDashboardCacheTtl: mockGetDashboardCacheTtl,
}))

vi.mock("@/lib/dashboard/get-scoped-dashboard", () => ({
  getScopedDashboard: mockGetScopedDashboard,
}))

import { getCachedScopedDashboard, invalidateDashboardCache } from "@/lib/dashboard/cache"
import { invalidateDashboardOnMutation } from "@/lib/dashboard/invalidate-on-mutation"

const dashboardItems = [
  {
    id: 1,
    orderId: 1,
    dueAt: new Date("2099-01-01T00:00:00.000Z"),
    isOverdue: false,
    measure: { id: 1, name: "M", code: null, description: null },
    order: {
      title: "O",
      issuedAt: new Date("2024-01-01T00:00:00.000Z"),
      organization: { id: 1, name: "Org" },
    },
    status: { id: 1, name: "Not started", isTerminal: false },
  },
  {
    id: 2,
    orderId: 1,
    dueAt: new Date("2099-01-01T00:00:00.000Z"),
    isOverdue: false,
    measure: { id: 2, name: "M2", code: null, description: null },
    order: {
      title: "O",
      issuedAt: new Date("2024-01-01T00:00:00.000Z"),
      organization: { id: 1, name: "Org" },
    },
    status: { id: 1, name: "Not started", isTerminal: false },
  },
]

const serializedDashboard = {
  stats: { scope: "global" as const, statusDistribution: [], overdueBreakdown: [], statusBreakdown: [], chartLabels: { overdueTitle: "", completionTitle: "" } },
  items: dashboardItems.map((item) => ({
    ...item,
    dueAt: item.dueAt.toISOString(),
    order: { ...item.order, issuedAt: item.order.issuedAt.toISOString() },
  })),
}

describe("getCachedScopedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDashboardCacheTtl.mockReturnValue(300)
    mockGetScopedDashboard.mockResolvedValue({
      stats: serializedDashboard.stats,
      items: dashboardItems,
    })
    mockGetCachedJson.mockImplementation(async (_key, _ttl, fetcher) => fetcher())
  })

  it("caches serialized dashboard via getCachedJson", async () => {
    const scope = { type: "global" as const }
    const result = await getCachedScopedDashboard(scope)
    expect(mockGetCachedJson).toHaveBeenCalledWith(
      "dashboard:global",
      300,
      expect.any(Function)
    )
    expect(result.items).toHaveLength(2)
  })

  it("applies limit to cached dashboard items", async () => {
    mockGetCachedJson.mockResolvedValue(serializedDashboard)
    const result = await getCachedScopedDashboard({ type: "global" }, { limit: 1 })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe(1)
  })

  it("ignores non-positive limit", async () => {
    mockGetCachedJson.mockResolvedValue(serializedDashboard)
    const result = await getCachedScopedDashboard({ type: "global" }, { limit: 0 })
    expect(result.items).toHaveLength(2)
  })
})

describe("invalidateDashboardCache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvalidateKeys.mockResolvedValue(undefined)
  })

  it("invalidates all dashboard cache keys by prefix", async () => {
    await invalidateDashboardCache()
    expect(mockInvalidateKeys).toHaveBeenCalledWith("dashboard:")
  })

  it("invalidates all dashboard keys when scope provided", async () => {
    await invalidateDashboardCache({ type: "organization", organizationId: 5 })
    expect(mockInvalidateKeys).toHaveBeenCalledWith("dashboard:")
  })
})

describe("invalidateDashboardOnMutation", () => {
  it("delegates to invalidateDashboardCache", async () => {
    mockInvalidateKeys.mockResolvedValue(undefined)
    await invalidateDashboardOnMutation({ type: "subdivision", organizationId: 1, subdivisionId: 2 })
    expect(mockInvalidateKeys).toHaveBeenCalledWith("dashboard:")
  })
})
