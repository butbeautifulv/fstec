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

import { findOrderItem } from "@/lib/orders/find-order-item"

describe("findOrderItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries orderItem by id and orderId with include", async () => {
    const item = { id: 5, orderId: 10, measure: { id: 1, name: "M1" } }
    mockPrisma.orderItem.findFirst.mockResolvedValue(item)

    const include = { measure: { select: { id: true, name: true } } }
    const result = await findOrderItem(10, 5, include)

    expect(result).toBe(item)
    expect(mockPrisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: { id: 5, orderId: 10 },
      include,
    })
  })

  it("returns null when item not found", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue(null)
    const result = await findOrderItem(1, 99, { status: true })
    expect(result).toBeNull()
  })
})
