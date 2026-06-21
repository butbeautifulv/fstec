import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import { listSidebarOrders } from "@/lib/nav/sidebar-orders"

describe("listSidebarOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries recent orders with default limit", async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ id: 1, title: "Order 1" }])
    const result = await listSidebarOrders()
    expect(result).toEqual([{ id: 1, title: "Order 1" }])
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
      orderBy: { issuedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    })
  })

  it("respects custom limit", async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    await listSidebarOrders(10)
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    )
  })
})
