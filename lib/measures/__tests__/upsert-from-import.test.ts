import { describe, expect, it, vi } from "vitest"
import { upsertMeasureFromImportItem } from "@/lib/measures/upsert-from-import"

describe("upsertMeasureFromImportItem", () => {
  it("returns existing measure when measureId is set", async () => {
    const measure = { id: 42, name: "Existing" }
    const tx = {
      measure: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(measure),
      },
    }

    const result = await upsertMeasureFromImportItem(
      {
        id: 1,
        code: "1.1",
        name: "Test",
        description: "Desc",
        measureId: 42,
      },
      10,
      1,
      tx as never
    )

    expect(result).toBe(measure)
    expect(tx.measure.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 42 } })
  })

  it("updates measure when code matches", async () => {
    const tx = {
      measure: {
        findFirst: vi.fn().mockResolvedValue({ id: 5 }),
        update: vi.fn().mockResolvedValue({ id: 5, name: "Updated" }),
      },
      measureImportItem: {
        update: vi.fn().mockResolvedValue({}),
      },
    }

    const result = await upsertMeasureFromImportItem(
      {
        id: 2,
        code: "1.2",
        name: "Updated",
        description: "New desc",
        measureId: null,
      },
      10,
      1,
      tx as never
    )

    expect(result).toEqual({ id: 5, name: "Updated" })
    expect(tx.measure.update).toHaveBeenCalled()
    expect(tx.measureImportItem.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { measureId: 5 },
    })
  })

  it("creates measure when code is new", async () => {
    const tx = {
      measure: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 99, name: "New" }),
      },
      measureImportItem: {
        update: vi.fn().mockResolvedValue({}),
      },
    }

    const result = await upsertMeasureFromImportItem(
      {
        id: 3,
        code: "2.1",
        name: "New",
        description: null,
        measureId: null,
      },
      10,
      1,
      tx as never
    )

    expect(result).toEqual({ id: 99, name: "New" })
    expect(tx.measure.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "2.1",
          sourceImportId: 10,
          sourceImportItemId: 3,
        }),
      })
    )
  })
})
