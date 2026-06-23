import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const mocks = vi.hoisted(() => ({ prismaRead: null as MockPrisma | null }))
const mockFetchScopedItems = vi.hoisted(() => vi.fn())
const mockSerializeDashboardScope = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prismaRead() {
    return mocks.prismaRead!
  },
}))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return { ...actual, cache: <T>(fn: T) => fn }
})

vi.mock("@/lib/dashboard/fetch-scoped-items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dashboard/fetch-scoped-items")>()
  return {
    ...actual,
    fetchScopedItems: mockFetchScopedItems,
  }
})

vi.mock("@/lib/dashboard/scope-key", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dashboard/scope-key")>(
    "@/lib/dashboard/scope-key"
  )
  return {
    ...actual,
    serializeDashboardScope: mockSerializeDashboardScope,
  }
})

mocks.prismaRead = createMockPrisma()
const mockPrismaRead = mocks.prismaRead

import { fetchScopedItems } from "@/lib/dashboard/fetch-scoped-items"
import { getScopedDashboard } from "@/lib/dashboard/get-scoped-dashboard"

const sampleItem = {
  id: 1,
  orderId: 10,
  dueAt: new Date("2099-01-01T00:00:00.000Z"),
  subdivisionId: null,
  status: { id: 1, name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
  measure: { id: 1, name: "Measure", code: null, description: null },
  subdivision: null,
  order: {
    id: 10,
    title: "Order A",
    issuedAt: new Date("2024-01-01T00:00:00.000Z"),
    organizationId: 5,
    organization: { id: 5, name: "Org" },
  },
}

describe("fetchScopedItems", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockPrismaRead.orderItem.findMany.mockResolvedValue([])
    const actual = await vi.importActual<typeof import("@/lib/dashboard/fetch-scoped-items")>(
      "@/lib/dashboard/fetch-scoped-items"
    )
    mockFetchScopedItems.mockImplementation(actual.fetchScopedItems)
  })

  it("queries all items for global scope", async () => {
    await fetchScopedItems({ type: "global" })
    expect(mockPrismaRead.orderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    )
  })

  it("filters by organization for organization scope", async () => {
    await fetchScopedItems({ type: "organization", organizationId: 42 })
    expect(mockPrismaRead.orderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { order: { organizationId: 42 } },
      })
    )
  })

  it("filters by organization and subdivision for subdivision scope", async () => {
    await fetchScopedItems({
      type: "subdivision",
      organizationId: 42,
      subdivisionId: 7,
    })
    expect(mockPrismaRead.orderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          order: { organizationId: 42 },
          subdivisionId: 7,
        },
      })
    )
  })
})

describe("getScopedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchScopedItems.mockResolvedValue([sampleItem])
    mockSerializeDashboardScope.mockImplementation((scope) => {
      if (scope.type === "global") return "global"
      if (scope.type === "organization") return `organization:${scope.organizationId}`
      return `subdivision:${scope.organizationId}:${scope.subdivisionId}`
    })
  })

  it("loads global dashboard stats and matrix items", async () => {
    const result = await getScopedDashboard({ type: "global" })
    expect(mockFetchScopedItems).toHaveBeenCalledWith({ type: "global" })
    expect(result.stats.scope).toBe("global")
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe(1)
  })

  it("loads organization-scoped dashboard", async () => {
    const scope = { type: "organization" as const, organizationId: 5 }
    const result = await getScopedDashboard(scope)
    expect(mockFetchScopedItems).toHaveBeenCalledWith(scope)
    expect(result.stats.scope).toBe("organization")
  })

  it("loads subdivision-scoped dashboard", async () => {
    const scope = {
      type: "subdivision" as const,
      organizationId: 5,
      subdivisionId: 3,
    }
    const result = await getScopedDashboard(scope)
    expect(mockFetchScopedItems).toHaveBeenCalledWith(scope)
    expect(result.stats.scope).toBe("subdivision")
  })

  it("falls back to global scope for unknown cache keys", async () => {
    mockSerializeDashboardScope.mockReturnValue("unknown-key")
    await getScopedDashboard({ type: "organization", organizationId: 99 })
    expect(mockFetchScopedItems).toHaveBeenCalledWith({ type: "global" })
  })
})
