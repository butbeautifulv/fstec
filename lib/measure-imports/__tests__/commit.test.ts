import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const upsertMeasureFromImportItem = vi.hoisted(() => vi.fn())
const revalidatePanelMeasures = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/measures/upsert-from-import", () => ({ upsertMeasureFromImportItem }))
vi.mock("@/lib/api/revalidate-panel", () => ({ revalidatePanelMeasures }))

import {
  commitMeasureImport,
  getCommittedMeasureIds,
} from "@/lib/measure-imports/commit"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

const parsedImport = {
  id: 1,
  status: "PARSED",
  items: [{ id: 10, code: "1.1", name: "Item", included: true }],
}

describe("commitMeasureImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.measureImport.findUnique
      .mockResolvedValueOnce(parsedImport)
      .mockResolvedValueOnce({ id: 1, status: "IMPORTED", items: [], measures: [] })
    upsertMeasureFromImportItem.mockResolvedValue({ id: 99 })
  })

  it("throws NOT_FOUND when import missing", async () => {
    mockPrisma.measureImport.findUnique.mockReset()
    mockPrisma.measureImport.findUnique.mockResolvedValue(null)
    await expect(commitMeasureImport(1, 5)).rejects.toThrow("NOT_FOUND")
  })

  it("throws IMPORT_INVALID_STATUS when not editable", async () => {
    mockPrisma.measureImport.findUnique.mockReset()
    mockPrisma.measureImport.findUnique.mockResolvedValue({
      ...parsedImport,
      status: "UPLOADED",
    })
    await expect(commitMeasureImport(1, 5)).rejects.toThrow("IMPORT_INVALID_STATUS")
  })

  it("throws NO_ITEMS when no included items", async () => {
    mockPrisma.measureImport.findUnique.mockReset()
    mockPrisma.measureImport.findUnique.mockResolvedValue({
      ...parsedImport,
      items: [],
    })
    await expect(commitMeasureImport(1, 5)).rejects.toThrow("NO_ITEMS")
  })

  it("commits items and revalidates panel", async () => {
    const result = await commitMeasureImport(1, 5)

    expect(upsertMeasureFromImportItem).toHaveBeenCalledWith(
      parsedImport.items[0],
      1,
      5,
      mockPrisma
    )
    expect(mockPrisma.measureImport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "IMPORTED" }),
      })
    )
    expect(revalidatePanelMeasures).toHaveBeenCalled()
    expect(result?.status).toBe("IMPORTED")
  })
})

describe("getCommittedMeasureIds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns measure ids from included items", async () => {
    mockPrisma.measureImportItem.findMany.mockResolvedValue([
      { measureId: 10 },
      { measureId: 20 },
    ])
    await expect(getCommittedMeasureIds(1)).resolves.toEqual([10, 20])
  })
})
