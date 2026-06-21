import { ResponseReviewStatus } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"
import {
  DELAY_STATUS_LABELS,
  DELAY_STATUS_VARIANT,
} from "@/lib/ui/delay-status"
import {
  getItemDetailDisplayState,
  getItemWorkflowPhase,
} from "@/lib/ui/item-detail-display"
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"
import {
  formatPublicBrandSubtitle,
  formatPublicBrandTitle,
  formatPublicBrandTooltip,
} from "@/lib/ui/sidebar-brand"
import { APP_SIDEBAR_NAME } from "@/lib/ui/branding"

describe("getItemDetailDisplayState", () => {
  const baseItem = {
    status: { name: WORKFLOW_STATUS.NOT_STARTED, isTerminal: false },
    dueAt: "2099-01-01T00:00:00.000Z",
  }

  it("returns not-started state with canStart", () => {
    const state = getItemDetailDisplayState(baseItem)
    expect(state).toMatchObject({
      completed: false,
      isOverdue: false,
      canStart: true,
      canSubmitReport: false,
      workflowStatusName: WORKFLOW_STATUS.NOT_STARTED,
      displayStatus: WORKFLOW_STATUS.NOT_STARTED,
    })
  })

  it("allows report submission when in progress without pending review", () => {
    const state = getItemDetailDisplayState({
      status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
      dueAt: "2099-01-01T00:00:00.000Z",
    })
    expect(state.canSubmitReport).toBe(true)
    expect(state.canStart).toBe(false)
  })

  it("shows pending review label and blocks submission", () => {
    const state = getItemDetailDisplayState(
      {
        status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
        dueAt: "2099-01-01T00:00:00.000Z",
      },
      { reviewStatus: ResponseReviewStatus.PENDING }
    )
    expect(state.isPendingReview).toBe(true)
    expect(state.reportStatusLabel).toBe("На проверке")
    expect(state.displayStatus).toBe("На проверке")
    expect(state.canSubmitReport).toBe(false)
  })

  it("shows rejected label and allows resubmission", () => {
    const state = getItemDetailDisplayState(
      {
        status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
        dueAt: "2099-01-01T00:00:00.000Z",
      },
      { reviewStatus: ResponseReviewStatus.REJECTED }
    )
    expect(state.isRejected).toBe(true)
    expect(state.reportStatusLabel).toBe("Требует доработки")
    expect(state.canSubmitReport).toBe(true)
  })

  it("marks completed terminal items", () => {
    const state = getItemDetailDisplayState({
      status: { name: WORKFLOW_STATUS.COMPLETED, isTerminal: true },
      dueAt: "2099-01-01T00:00:00.000Z",
    })
    expect(state.completed).toBe(true)
    expect(state.canSubmitReport).toBe(false)
  })

  it("detects overdue items", () => {
    const state = getItemDetailDisplayState({
      status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
      dueAt: "2020-01-01T00:00:00.000Z",
    })
    expect(state.isOverdue).toBe(true)
  })
})

describe("getItemWorkflowPhase", () => {
  it("returns completed when item is done", () => {
    expect(
      getItemWorkflowPhase({
        completed: true,
        isPendingReview: false,
        isRejected: false,
        canSubmitReport: false,
      })
    ).toBe("completed")
  })

  it("returns pending_review when review is pending", () => {
    expect(
      getItemWorkflowPhase({
        completed: false,
        isPendingReview: true,
        isRejected: false,
        canSubmitReport: false,
      })
    ).toBe("pending_review")
  })

  it("returns rejected when review was rejected", () => {
    expect(
      getItemWorkflowPhase({
        completed: false,
        isPendingReview: false,
        isRejected: true,
        canSubmitReport: true,
      })
    ).toBe("rejected")
  })

  it("returns in_progress_form when report can be submitted", () => {
    expect(
      getItemWorkflowPhase({
        completed: false,
        isPendingReview: false,
        isRejected: false,
        canSubmitReport: true,
      })
    ).toBe("in_progress_form")
  })

  it("defaults to not_started", () => {
    expect(
      getItemWorkflowPhase({
        completed: false,
        isPendingReview: false,
        isRejected: false,
        canSubmitReport: false,
      })
    ).toBe("not_started")
  })
})

describe("DELAY_STATUS_*", () => {
  it("maps all delay statuses", () => {
    expect(DELAY_STATUS_VARIANT.PENDING).toBe("destructive")
    expect(DELAY_STATUS_VARIANT.APPROVED).toBe("secondary")
    expect(DELAY_STATUS_VARIANT.REJECTED).toBe("outline")
    expect(DELAY_STATUS_LABELS.PENDING).toBe("Ожидает")
    expect(DELAY_STATUS_LABELS.APPROVED).toBe("Одобрен")
    expect(DELAY_STATUS_LABELS.REJECTED).toBe("Отклонён")
  })
})

describe("RESPONSE_REVIEW_STATUS_*", () => {
  it("maps all response review statuses", () => {
    expect(RESPONSE_REVIEW_STATUS_VARIANT.PENDING).toBe("destructive")
    expect(RESPONSE_REVIEW_STATUS_VARIANT.ACCEPTED).toBe("secondary")
    expect(RESPONSE_REVIEW_STATUS_VARIANT.REJECTED).toBe("outline")
    expect(RESPONSE_REVIEW_STATUS_LABELS.PENDING).toBe("На проверке")
    expect(RESPONSE_REVIEW_STATUS_LABELS.ACCEPTED).toBe("Принят")
    expect(RESPONSE_REVIEW_STATUS_LABELS.REJECTED).toBe("Не принят")
  })
})

describe("sidebar brand formatters", () => {
  it("returns app sidebar name as title", () => {
    expect(formatPublicBrandTitle()).toBe(APP_SIDEBAR_NAME)
  })

  it("formats subtitle with org only", () => {
    expect(formatPublicBrandSubtitle("Org A")).toBe("Org A")
  })

  it("formats subtitle with org and subdivision", () => {
    expect(formatPublicBrandSubtitle("Org A", "IT")).toBe("Org A · IT")
  })

  it("formats tooltip same as subtitle", () => {
    expect(formatPublicBrandTooltip("Org A", "IT")).toBe("Org A · IT")
    expect(formatPublicBrandTooltip("Org A")).toBe("Org A")
  })
})
