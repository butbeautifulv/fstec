import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

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

import {
  fetchOrderItemDetail,
  fetchOrderItemDetailById,
  ORDER_ITEM_DETAIL_INCLUDE,
} from "@/lib/order-items/fetch-detail"

describe("fetchOrderItemDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries with detail include", async () => {
    mockPrismaRead.orderItem.findFirst.mockResolvedValue({ id: 1 })
    const where = { id: 1, order: { organizationId: 10 } }
    const result = await fetchOrderItemDetail(where)
    expect(result).toEqual({ id: 1 })
    expect(mockPrismaRead.orderItem.findFirst).toHaveBeenCalledWith({
      where,
      include: ORDER_ITEM_DETAIL_INCLUDE,
    })
  })

  it("returns null when not found", async () => {
    mockPrismaRead.orderItem.findFirst.mockResolvedValue(null)
    expect(await fetchOrderItemDetail({ id: 999 })).toBeNull()
  })
})

describe("fetchOrderItemDetailById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries by id with detail include", async () => {
    mockPrismaRead.orderItem.findUnique.mockResolvedValue({ id: 5 })
    const result = await fetchOrderItemDetailById(5)
    expect(result).toEqual({ id: 5 })
    expect(mockPrismaRead.orderItem.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      include: ORDER_ITEM_DETAIL_INCLUDE,
    })
  })
})
