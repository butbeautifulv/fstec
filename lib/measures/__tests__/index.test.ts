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

import {
  createMeasure,
  deleteMeasure,
  getMeasure,
  listMeasures,
  updateMeasure,
} from "@/lib/measures"

describe("measures index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listMeasures orders by createdAt desc", async () => {
    mockPrisma.measure.findMany.mockResolvedValue([{ id: 1 }])
    const result = await listMeasures()
    expect(result).toEqual([{ id: 1 }])
    expect(mockPrisma.measure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    )
  })

  it("getMeasure loads measure by id", async () => {
    mockPrisma.measure.findUnique.mockResolvedValue({ id: 2, name: "M2" })
    const result = await getMeasure(2)
    expect(result).toEqual({ id: 2, name: "M2" })
    expect(mockPrisma.measure.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    )
  })

  it("createMeasure persists measure with creator", async () => {
    mockPrisma.measure.create.mockResolvedValue({ id: 1, name: "New measure" })
    await createMeasure({ name: "New measure", description: "Desc", code: "C1" }, 5)
    expect(mockPrisma.measure.create).toHaveBeenCalledWith({
      data: {
        name: "New measure",
        description: "Desc",
        code: "C1",
        createdById: 5,
      },
    })
  })

  it("createMeasure nulls optional fields when omitted", async () => {
    mockPrisma.measure.create.mockResolvedValue({ id: 2, name: "Bare" })
    await createMeasure({ name: "Bare" }, 3)
    expect(mockPrisma.measure.create).toHaveBeenCalledWith({
      data: {
        name: "Bare",
        description: null,
        code: null,
        createdById: 3,
      },
    })
  })

  it("updateMeasure updates fields", async () => {
    mockPrisma.measure.update.mockResolvedValue({ id: 1 })
    await updateMeasure(1, { name: "Updated", code: null })
    expect(mockPrisma.measure.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Updated", description: null, code: null },
    })
  })

  it("deleteMeasure throws MEASURE_IN_USE when referenced by order items", async () => {
    mockPrisma.orderItem.count.mockResolvedValue(2)
    await expect(deleteMeasure(1)).rejects.toThrow("MEASURE_IN_USE")
    expect(mockPrisma.measure.delete).not.toHaveBeenCalled()
  })

  it("deleteMeasure removes measure when not in use", async () => {
    mockPrisma.orderItem.count.mockResolvedValue(0)
    mockPrisma.measure.delete.mockResolvedValue({ id: 1 })
    await deleteMeasure(1)
    expect(mockPrisma.measure.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
