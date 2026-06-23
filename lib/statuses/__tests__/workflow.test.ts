import { describe, expect, it } from "vitest"
import {
  canSubmitOrderItemReport,
  getDisplayStatusName,
  getDashboardDisplayStatusName,
  isCompleted,
  isInProgress,
  isOrderItemOverdue,
  isSelectableWorkflowStatus,
  OVERDUE_LABEL,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"

const now = new Date("2026-06-01T12:00:00Z")

function item(
  name: string,
  dueAt: string,
  isTerminal = false
) {
  return {
    status: { name, isTerminal },
    dueAt,
  }
}

describe("isOrderItemOverdue", () => {
  it("is overdue when past due and not terminal", () => {
    expect(
      isOrderItemOverdue(item(WORKFLOW_STATUS.IN_PROGRESS, "2026-05-01"), now)
    ).toBe(true)
  })

  it("is not overdue when due in future", () => {
    expect(
      isOrderItemOverdue(item(WORKFLOW_STATUS.IN_PROGRESS, "2026-12-01"), now)
    ).toBe(false)
  })

  it("is not overdue when completed", () => {
    expect(
      isOrderItemOverdue(
        item(WORKFLOW_STATUS.COMPLETED, "2026-01-01", true),
        now
      )
    ).toBe(false)
  })
})

describe("getDisplayStatusName", () => {
  it("returns overdue label for past-due active items", () => {
    expect(
      getDisplayStatusName(item(WORKFLOW_STATUS.IN_PROGRESS, "2026-01-01"), now)
    ).toBe(OVERDUE_LABEL)
  })

  it("returns workflow status when not overdue", () => {
    expect(
      getDisplayStatusName(item(WORKFLOW_STATUS.IN_PROGRESS, "2026-12-01"), now)
    ).toBe(WORKFLOW_STATUS.IN_PROGRESS)
  })
})

describe("getDashboardDisplayStatusName", () => {
  it("matches display status", () => {
    const row = item(WORKFLOW_STATUS.IN_PROGRESS, "2026-12-01")
    expect(getDashboardDisplayStatusName(row, now)).toBe(
      getDisplayStatusName(row, now)
    )
  })
})

describe("isInProgress", () => {
  it("accepts in progress only", () => {
    expect(isInProgress(WORKFLOW_STATUS.IN_PROGRESS)).toBe(true)
    expect(isInProgress(WORKFLOW_STATUS.COMPLETED)).toBe(false)
  })
})

describe("canSubmitOrderItemReport", () => {
  it("allows in-progress non-terminal items", () => {
    expect(
      canSubmitOrderItemReport({
        name: WORKFLOW_STATUS.IN_PROGRESS,
        isTerminal: false,
      })
    ).toBe(true)
    expect(
      canSubmitOrderItemReport({
        name: WORKFLOW_STATUS.COMPLETED,
        isTerminal: true,
      })
    ).toBe(false)
  })
})

describe("isCompleted", () => {
  it("uses isTerminal flag", () => {
    expect(isCompleted({ isTerminal: true })).toBe(true)
    expect(isCompleted({ isTerminal: false, name: WORKFLOW_STATUS.IN_PROGRESS })).toBe(
      false
    )
  })
})

describe("isSelectableWorkflowStatus", () => {
  it("allows workflow statuses only", () => {
    expect(isSelectableWorkflowStatus(WORKFLOW_STATUS.IN_PROGRESS)).toBe(true)
    expect(isSelectableWorkflowStatus(WORKFLOW_STATUS.COMPLETED)).toBe(true)
    expect(isSelectableWorkflowStatus(OVERDUE_LABEL)).toBe(false)
  })
})
