import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockGetDefaultStatusId = vi.hoisted(() => vi.fn())
const mockGetScopedDashboard = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("@/lib/statuses", () => ({
  getDefaultStatusId: mockGetDefaultStatusId,
}))

vi.mock("@/lib/dashboard/get-scoped-dashboard", () => ({
  getScopedDashboard: mockGetScopedDashboard,
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  createOrder,
  deleteOrder,
  deleteOrderItem,
  getDashboardMatrix,
  getOrder,
  getOrderForEdit,
  getOrderItemContext,
  getOrderItemDelayRequests,
  getOrderItemForResponse,
  getScopedDashboardMatrix,
  listOrders,
  updateOrder,
  updateOrderItem,
} from "@/lib/orders"

describe("orders index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDefaultStatusId.mockResolvedValue(3)
    mockGetScopedDashboard.mockResolvedValue({ items: [{ id: "cell-1" }] })
  })

  it("listOrders filters by sourceImportId when provided", async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ id: 1 }])
    await listOrders({ sourceImportId: 9 })
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sourceImportId: 9 } })
    )
  })

  it("listOrders omits where when sourceImportId absent", async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    await listOrders()
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it("getOrder loads order with relations", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 5 })
    const result = await getOrder(5)
    expect(result).toEqual({ id: 5 })
    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    )
  })

  it("getOrderForEdit selects id and title", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 1, title: "T" })
    await getOrderForEdit(1)
    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, title: true },
    })
  })

  it("getOrderItemContext delegates to findOrderItem", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2 })
    await getOrderItemContext(10, 2)
    expect(mockPrisma.orderItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2, orderId: 10 } })
    )
  })

  it("createOrder uses default status for items", async () => {
    mockPrisma.order.create.mockResolvedValue({ id: 1 })
    await createOrder(
      {
        title: "New",
        organizationId: 1,
        items: [{ measureId: 10, dueAt: new Date("2026-01-01") }],
      },
      99
    )
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: 99,
          items: {
            create: [
              expect.objectContaining({ measureId: 10, statusId: 3 }),
            ],
          },
        }),
      })
    )
  })

  it("updateOrder updates title", async () => {
    mockPrisma.order.update.mockResolvedValue({ id: 1, title: "Updated" })
    await updateOrder(1, { title: "Updated" })
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { title: "Updated" } })
    )
  })

  it("deleteOrder removes order by id", async () => {
    mockPrisma.order.delete.mockResolvedValue({ id: 1 })
    await deleteOrder(1)
    expect(mockPrisma.order.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it("updateOrderItem throws NOT_FOUND when item missing", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue(null)
    await expect(updateOrderItem(1, 2, { statusId: 5 })).rejects.toThrow("NOT_FOUND")
  })

  it("updateOrderItem updates existing item", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2 })
    mockPrisma.orderItem.update.mockResolvedValue({ id: 2, statusId: 5 })
    await updateOrderItem(1, 2, { statusId: 5 })
    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 }, data: { statusId: 5 } })
    )
  })

  it("updateOrderItem updates dueAt and subdivisionId", async () => {
    const dueAt = new Date("2026-08-01T00:00:00.000Z")
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2 })
    mockPrisma.orderItem.update.mockResolvedValue({ id: 2 })
    await updateOrderItem(1, 2, { dueAt, subdivisionId: 9 })
    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { dueAt, subdivisionId: 9 },
      })
    )
  })

  it("deleteOrderItem throws NOT_FOUND when item missing", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue(null)
    await expect(deleteOrderItem(1, 2)).rejects.toThrow("NOT_FOUND")
  })

  it("deleteOrderItem removes existing item", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2 })
    mockPrisma.orderItem.delete.mockResolvedValue({ id: 2 })
    await deleteOrderItem(1, 2)
    expect(mockPrisma.orderItem.delete).toHaveBeenCalledWith({ where: { id: 2 } })
  })

  it("getOrderItemDelayRequests loads item with delay requests", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2, delayRequests: [] })
    await getOrderItemDelayRequests(1, 2)
    expect(mockPrisma.orderItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2, orderId: 1 },
        include: expect.objectContaining({
          delayRequests: { orderBy: { createdAt: "desc" } },
        }),
      })
    )
  })

  it("getOrderItemForResponse loads item for response form", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 2 })
    await getOrderItemForResponse(1, 2)
    expect(mockPrisma.orderItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2, orderId: 1 },
        include: expect.objectContaining({
          measure: { select: { id: true, name: true } },
        }),
      })
    )
  })

  it("getScopedDashboardMatrix returns dashboard items", async () => {
    const items = await getScopedDashboardMatrix({ type: "organization", organizationId: 1 })
    expect(items).toEqual([{ id: "cell-1" }])
    expect(mockGetScopedDashboard).toHaveBeenCalledWith({
      type: "organization",
      organizationId: 1,
    })
  })

  it("getDashboardMatrix uses global scope", async () => {
    await getDashboardMatrix()
    expect(mockGetScopedDashboard).toHaveBeenCalledWith({ type: "global" })
  })
})
