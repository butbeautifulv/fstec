import { describe, expect, it } from "vitest"
import { mapMatrixItemToPublicItem } from "@/lib/public/map-public-items"

describe("mapMatrixItemToPublicItem", () => {
  it("maps subdivision id and name", () => {
    const item = mapMatrixItemToPublicItem({
      id: 1,
      orderId: 10,
      dueAt: new Date("2024-06-01T00:00:00.000Z"),
      isOverdue: false,
      measure: { id: 5, name: "Measure", code: "M-1", description: null },
      order: {
        title: "Order",
        issuedAt: new Date("2024-05-01T00:00:00.000Z"),
        organization: { id: 2, name: "Org" },
      },
      status: { id: 3, name: "В работе", isTerminal: false },
      subdivision: { id: 7, name: "IT" },
    })

    expect(item.subdivisionName).toBe("IT")
    expect(item.subdivisionId).toBe(7)
  })

  it("maps null subdivision fields when absent", () => {
    const item = mapMatrixItemToPublicItem({
      id: 1,
      orderId: 10,
      dueAt: "2024-06-01T00:00:00.000Z",
      isOverdue: false,
      measure: { id: 5, name: "Measure", code: null, description: null },
      order: {
        title: "Order",
        issuedAt: "2024-05-01T00:00:00.000Z",
        organization: { id: 2, name: "Org" },
      },
      status: { id: 3, name: "В работе", isTerminal: false },
      subdivision: null,
    })

    expect(item.subdivisionName).toBeNull()
    expect(item.subdivisionId).toBeNull()
  })
})
