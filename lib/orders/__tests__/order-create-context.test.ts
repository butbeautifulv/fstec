import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockNotFound = vi.hoisted(() => vi.fn())
const mockListSupervisedOrganizations = vi.hoisted(() => vi.fn())
const mockGetMeasureImport = vi.hoisted(() => vi.fn())
const mockGetCommittedMeasureIds = vi.hoisted(() => vi.fn())
const mockDefaultOrderTitle = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}))

vi.mock("@/lib/organizations", () => ({
  listSupervisedOrganizations: mockListSupervisedOrganizations,
}))

vi.mock("@/lib/measure-imports", () => ({
  getMeasureImport: mockGetMeasureImport,
}))

vi.mock("@/lib/measure-imports/commit", () => ({
  getCommittedMeasureIds: mockGetCommittedMeasureIds,
}))

vi.mock("@/lib/measure-imports/extract-metadata", () => ({
  defaultOrderTitle: mockDefaultOrderTitle,
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import { loadOrderCreateContext } from "@/lib/orders/order-create-context"

const organizations = [
  {
    id: 1,
    name: "Org A",
    subdivisions: [{ id: 10, name: "Sub A" }],
  },
]

describe("loadOrderCreateContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND")
    })
    mockListSupervisedOrganizations.mockResolvedValue(organizations)
  })

  it("returns empty defaults without importId", async () => {
    const result = await loadOrderCreateContext({})

    expect(result.importRecord).toBeNull()
    expect(result.defaultTitle).toBe("")
    expect(result.measureIds).toEqual([])
    expect(result.measures).toEqual([])
    expect(result.organizations).toEqual([
      { id: 1, name: "Org A", subdivisions: [{ id: 10, name: "Sub A" }] },
    ])
    expect(mockGetMeasureImport).not.toHaveBeenCalled()
  })

  it("loads import context when import is IMPORTED", async () => {
    const reportDueAt = new Date("2026-08-15T10:00:00Z")
    mockGetMeasureImport.mockResolvedValue({
      id: 5,
      status: "IMPORTED",
      documentNumber: "DOC-1",
      title: "Import title",
      originalName: "file.docx",
      reportDueAt,
    })
    mockGetCommittedMeasureIds.mockResolvedValue([10, 11])
    mockDefaultOrderTitle.mockReturnValue("Order from DOC-1")
    mockPrisma.measure.findMany.mockResolvedValue([
      {
        id: 10,
        name: "Measure 10",
        code: "M10",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    const result = await loadOrderCreateContext({ importId: 5 })

    expect(result.importRecord).toEqual({
      id: 5,
      documentNumber: "DOC-1",
      title: "Import title",
      originalName: "file.docx",
    })
    expect(result.defaultTitle).toBe("Order from DOC-1")
    expect(result.measureIds).toEqual([10, 11])
    expect(result.measures).toHaveLength(1)
    expect(result.measures[0]?.createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(mockPrisma.measure.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 11] } },
      select: { id: true, name: true, code: true, createdAt: true },
    })
  })

  it("calls notFound when import missing or not IMPORTED", async () => {
    mockGetMeasureImport.mockResolvedValue(null)
    await expect(loadOrderCreateContext({ importId: 1 })).rejects.toThrow("NEXT_NOT_FOUND")
    expect(mockNotFound).toHaveBeenCalled()

    mockNotFound.mockClear()
    mockGetMeasureImport.mockResolvedValue({ id: 1, status: "PENDING" })
    await expect(loadOrderCreateContext({ importId: 1 })).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("calls notFound when import has no committed measures", async () => {
    mockGetMeasureImport.mockResolvedValue({
      id: 5,
      status: "IMPORTED",
      documentNumber: null,
      title: null,
      originalName: "file.docx",
      reportDueAt: null,
    })
    mockGetCommittedMeasureIds.mockResolvedValue([])

    await expect(loadOrderCreateContext({ importId: 5 })).rejects.toThrow("NEXT_NOT_FOUND")
    expect(mockNotFound).toHaveBeenCalled()
  })
})
