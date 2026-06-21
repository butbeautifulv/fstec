import { describe, expect, it, vi } from "vitest"
import { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"
import { validateBatchTargets } from "@/lib/orders/validate-batch-targets"
import type { BatchTarget } from "@/lib/orders/batch-targets"

function createMockDb(overrides?: {
  measures?: { id: number }[]
  orgs?: { id: number; subdivisions: { id: number }[] }[]
}) {
  return {
    measure: {
      findMany: vi.fn().mockResolvedValue(overrides?.measures ?? [{ id: 10 }]),
    },
    organization: {
      findMany: vi.fn().mockResolvedValue(
        overrides?.orgs ?? [
          { id: 1, subdivisions: [{ id: 10 }, { id: 11 }] },
        ]
      ),
    },
  }
}

describe("validateBatchTargets", () => {
  it("returns deduped targets when all valid", async () => {
    const db = createMockDb()
    const targets: BatchTarget[] = [
      { organizationId: 1, subdivisionId: 10 },
      { organizationId: 1, subdivisionId: 10 },
    ]

    const result = await validateBatchTargets(db, targets, [10])
    expect(result).toEqual([{ organizationId: 1, subdivisionId: 10 }])
  })

  it("throws INVALID_TARGETS for empty list", async () => {
    const db = createMockDb()
    await expect(validateBatchTargets(db, [], [10])).rejects.toThrow(
      BatchCreateValidationError
    )
    await expect(validateBatchTargets(db, [], [10])).rejects.toMatchObject({
      message: "INVALID_TARGETS",
    })
  })

  it("throws TARGETS_CONFLICT for org + subdivision mix", async () => {
    const db = createMockDb()
    await expect(
      validateBatchTargets(
        db,
        [
          { organizationId: 1, subdivisionId: null },
          { organizationId: 1, subdivisionId: 10 },
        ],
        [10]
      )
    ).rejects.toMatchObject({ message: "TARGETS_CONFLICT" })
  })

  it("throws INVALID_MEASURES when measure missing", async () => {
    const db = createMockDb({ measures: [] })
    await expect(
      validateBatchTargets(db, [{ organizationId: 1, subdivisionId: null }], [99])
    ).rejects.toMatchObject({ message: "INVALID_MEASURES" })
  })

  it("throws INVALID_TARGETS for unknown organization", async () => {
    const db = createMockDb({ orgs: [] })
    await expect(
      validateBatchTargets(db, [{ organizationId: 99, subdivisionId: null }], [10])
    ).rejects.toMatchObject({ message: "INVALID_TARGETS" })
  })

  it("throws INVALID_TARGETS for unknown subdivision", async () => {
    const db = createMockDb()
    await expect(
      validateBatchTargets(db, [{ organizationId: 1, subdivisionId: 999 }], [10])
    ).rejects.toMatchObject({ message: "INVALID_TARGETS" })
  })
})
