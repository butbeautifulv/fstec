import { describe, expect, it } from "vitest"
import { getItemDetailStatusVariant } from "@/lib/ui/item-detail-status"

describe("getItemDetailStatusVariant", () => {
  it("returns destructive for overdue", () => {
    expect(
      getItemDetailStatusVariant({
        isOverdue: true,
        isPendingReview: false,
        completed: false,
      })
    ).toBe("destructive")
  })

  it("returns destructive for pending review", () => {
    expect(
      getItemDetailStatusVariant({
        isOverdue: false,
        isPendingReview: true,
        completed: false,
      })
    ).toBe("destructive")
  })

  it("returns destructive for rejected", () => {
    expect(
      getItemDetailStatusVariant({
        isOverdue: false,
        isPendingReview: false,
        isRejected: true,
        completed: false,
      })
    ).toBe("destructive")
  })

  it("returns default for completed", () => {
    expect(
      getItemDetailStatusVariant({
        isOverdue: false,
        isPendingReview: false,
        completed: true,
      })
    ).toBe("default")
  })

  it("returns secondary for in-progress state", () => {
    expect(
      getItemDetailStatusVariant({
        isOverdue: false,
        isPendingReview: false,
        completed: false,
      })
    ).toBe("secondary")
  })
})
