import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockGetDefaultStatusId = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("@/lib/statuses", () => ({
  getDefaultStatusId: mockGetDefaultStatusId,
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  BatchCreateValidationError,
  batchCreateOrders,
} from "@/lib/orders/batch-create"

describe("batchCreateOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDefaultStatusId.mockResolvedValue(7)
    mockPrisma.measure.findMany.mockResolvedValue([{ id: 10 }])
    mockPrisma.organization.findMany.mockResolvedValue([
      { id: 1, subdivisions: [{ id: 10 }, { id: 11 }] },
    ])
  })

  it("creates orders for validated targets in a transaction", async () => {
    const dueAt = new Date("2026-07-01T12:00:00Z")
    const createdOrder = {
      id: 100,
      title: "Batch order",
      organization: { id: 1, name: "Org A" },
      _count: { items: 1 },
    }

    mockPrisma.$transaction.mockImplementation(async (cb) => {
      mockPrisma.order.create.mockResolvedValue(createdOrder)
      return cb(mockPrisma)
    })

    const result = await batchCreateOrders(
      {
        title: "Batch order",
        measureIds: [10],
        defaultDueAt: dueAt,
        targets: [{ organizationId: 1, subdivisionId: 10 }],
      },
      42
    )

    expect(mockGetDefaultStatusId).toHaveBeenCalled()
    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(result).toEqual([createdOrder])
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Batch order",
          organizationId: 1,
          createdById: 42,
          defaultDueAt: dueAt,
          items: {
            create: [
              {
                measureId: 10,
                dueAt,
                statusId: 7,
                subdivisionId: 10,
              },
            ],
          },
        }),
      })
    )
  })

  it("throws IMPORT_INVALID_STATUS when source import is not IMPORTED", async () => {
    mockPrisma.measureImport.findUnique.mockResolvedValue({ status: "PENDING" })

    await expect(
      batchCreateOrders(
        {
          title: "Batch",
          measureIds: [10],
          defaultDueAt: new Date(),
          targets: [{ organizationId: 1, subdivisionId: null }],
          sourceImportId: 5,
        },
        1
      )
    ).rejects.toMatchObject({ message: "IMPORT_INVALID_STATUS" })

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("throws IMPORT_INVALID_STATUS when source import missing", async () => {
    mockPrisma.measureImport.findUnique.mockResolvedValue(null)

    await expect(
      batchCreateOrders(
        {
          title: "Batch",
          measureIds: [10],
          defaultDueAt: new Date(),
          targets: [{ organizationId: 1, subdivisionId: null }],
          sourceImportId: 5,
        },
        1
      )
    ).rejects.toBeInstanceOf(BatchCreateValidationError)
  })

  it("propagates validation errors from validateBatchTargets", async () => {
    mockPrisma.measure.findMany.mockResolvedValue([])

    await expect(
      batchCreateOrders(
        {
          title: "Batch",
          measureIds: [99],
          defaultDueAt: new Date(),
          targets: [{ organizationId: 1, subdivisionId: null }],
        },
        1
      )
    ).rejects.toMatchObject({ message: "INVALID_MEASURES" })
  })

  it("creates organization-level orders when subdivisionId is null", async () => {
    const dueAt = new Date("2026-07-01T12:00:00Z")
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      mockPrisma.order.create.mockResolvedValue({
        id: 101,
        title: "Org order",
        organization: { id: 1, name: "Org A" },
        _count: { items: 1 },
      })
      return cb(mockPrisma)
    })

    await batchCreateOrders(
      {
        title: "Org order",
        measureIds: [10],
        defaultDueAt: dueAt,
        targets: [{ organizationId: 1, subdivisionId: null }],
      },
      42
    )

    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              {
                measureId: 10,
                dueAt,
                statusId: 7,
                subdivisionId: null,
              },
            ],
          },
        }),
      })
    )
  })

  it("creates orders with per-target measureIds", async () => {
    const dueAt = new Date("2026-07-01T12:00:00Z")
    mockPrisma.measure.findMany.mockResolvedValue([{ id: 10 }, { id: 20 }])
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      mockPrisma.order.create.mockResolvedValue({
        id: 102,
        title: "Split",
        organization: { id: 1, name: "Org" },
        _count: { items: 1 },
      })
      return cb(mockPrisma)
    })

    await batchCreateOrders(
      {
        title: "Split",
        defaultDueAt: dueAt,
        targets: [
          { organizationId: 1, subdivisionId: 10, measureIds: [10] },
          { organizationId: 1, subdivisionId: 11, measureIds: [20] },
        ],
      },
      1
    )

    expect(mockPrisma.order.create).toHaveBeenCalledTimes(2)
  })
})
