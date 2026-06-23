import { beforeEach, describe, expect, it, vi } from "vitest"

const mockFindMany = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  prismaRead: {
    orderItem: {
      findMany: mockFindMany,
    },
  },
}))

import { fetchScopedItems } from "@/lib/dashboard/fetch-scoped-items"

describe("fetchScopedItems issuedAt filter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it("applies issuedFrom and issuedTo on order relation", async () => {
    const issuedFrom = new Date("2024-01-01T00:00:00.000Z")
    const issuedTo = new Date("2024-12-31T23:59:59.999Z")

    await fetchScopedItems({
      type: "global",
      issuedFrom,
      issuedTo,
    })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          order: {
            issuedAt: { gte: issuedFrom, lte: issuedTo },
          },
        },
      })
    )
  })

  it("scopes organization and date range together", async () => {
    const issuedFrom = new Date("2024-06-01T00:00:00.000Z")

    await fetchScopedItems({
      type: "organization",
      organizationId: 5,
      issuedFrom,
    })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          order: {
            organizationId: 5,
            issuedAt: { gte: issuedFrom },
          },
        },
      })
    )
  })
})
