import { describe, expect, it } from "vitest"
import { ResponseReviewStatus } from "@prisma/client"
import {
  getItemDetailDisplayState,
  getItemWorkflowPhase,
} from "@/lib/ui/item-detail-display"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const baseItem = {
  dueAt: "2026-12-01T00:00:00.000Z",
  status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
}

describe("getItemDetailDisplayState", () => {
  it("allows report submission for in-progress items", () => {
    const state = getItemDetailDisplayState(baseItem, null)
    expect(state.canSubmitReport).toBe(true)
    expect(state.workflowStatusName).toBe(WORKFLOW_STATUS.IN_PROGRESS)
    expect(state.displayStatus).toBe(WORKFLOW_STATUS.IN_PROGRESS)
  })

  it("blocks submission while pending review", () => {
    const state = getItemDetailDisplayState(baseItem, {
      reviewStatus: ResponseReviewStatus.PENDING,
    })
    expect(state.canSubmitReport).toBe(false)
    expect(state.isPendingReview).toBe(true)
    expect(state.displayStatus).toBe("На проверке")
  })

  it("allows resubmission after rejection", () => {
    const state = getItemDetailDisplayState(baseItem, {
      reviewStatus: ResponseReviewStatus.REJECTED,
    })
    expect(state.canSubmitReport).toBe(true)
    expect(state.isRejected).toBe(true)
  })
})

describe("getItemWorkflowPhase", () => {
  it("returns in_progress_form for active items", () => {
    const state = getItemDetailDisplayState(baseItem, null)
    expect(getItemWorkflowPhase(state)).toBe("in_progress_form")
  })
})
