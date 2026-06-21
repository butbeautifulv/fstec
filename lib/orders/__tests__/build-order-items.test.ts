import { describe, expect, it } from "vitest"
import { buildOrderItemsCreate } from "@/lib/orders/build-order-items"

describe("buildOrderItemsCreate", () => {
  it("maps measure ids to order item create input", () => {
    const dueAt = new Date("2026-06-01")
    const result = buildOrderItemsCreate({
      measureIds: [1, 2],
      dueAt,
      statusId: 5,
      subdivisionId: 10,
    })

    expect(result).toEqual([
      { measureId: 1, dueAt, statusId: 5, subdivisionId: 10 },
      { measureId: 2, dueAt, statusId: 5, subdivisionId: 10 },
    ])
  })

  it("defaults subdivisionId to null", () => {
    const dueAt = new Date("2026-06-01")
    const result = buildOrderItemsCreate({
      measureIds: [3],
      dueAt,
      statusId: 1,
    })

    expect(result[0]?.subdivisionId).toBeNull()
  })
})
