import { describe, expect, it } from "vitest"
import {
  getDisplayStatusName,
  isCompleted,
  isInProgress,
  isNotStarted,
  isOrderItemOverdue,
  isSelectableWorkflowStatus,
  LEGACY_NOT_STARTED_STATUS,
  LEGACY_OVERDUE_STATUS,
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
      isOrderItemOverdue(item(WORKFLOW_STATUS.NOT_STARTED, "2026-12-01"), now)
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

  it("requires isTerminal flag when status name is completed", () => {
    expect(
      isOrderItemOverdue(item(WORKFLOW_STATUS.COMPLETED, "2026-01-01", false), now)
    ).toBe(true)
    expect(
      isOrderItemOverdue(item(WORKFLOW_STATUS.COMPLETED, "2026-01-01", true), now)
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

describe("isNotStarted", () => {
  it("accepts current and legacy labels", () => {
    expect(isNotStarted(WORKFLOW_STATUS.NOT_STARTED)).toBe(true)
    expect(isNotStarted(LEGACY_NOT_STARTED_STATUS)).toBe(true)
    expect(isNotStarted(WORKFLOW_STATUS.IN_PROGRESS)).toBe(false)
  })
})

describe("isInProgress", () => {
  it("accepts in progress and legacy overdue label", () => {
    expect(isInProgress(WORKFLOW_STATUS.IN_PROGRESS)).toBe(true)
    expect(isInProgress(LEGACY_OVERDUE_STATUS)).toBe(true)
    expect(isInProgress(WORKFLOW_STATUS.NOT_STARTED)).toBe(false)
  })
})

describe("isCompleted", () => {
  it("uses isTerminal flag", () => {
    expect(isCompleted({ isTerminal: true })).toBe(true)
    expect(isCompleted({ isTerminal: false, name: WORKFLOW_STATUS.NOT_STARTED })).toBe(
      false
    )
  })

  it("recognizes completed status name", () => {
    expect(
      isCompleted({ isTerminal: false, name: WORKFLOW_STATUS.COMPLETED })
    ).toBe(true)
  })
})

describe("isSelectableWorkflowStatus", () => {
  it("allows workflow statuses only", () => {
    expect(isSelectableWorkflowStatus(WORKFLOW_STATUS.NOT_STARTED)).toBe(true)
    expect(isSelectableWorkflowStatus(WORKFLOW_STATUS.IN_PROGRESS)).toBe(true)
    expect(isSelectableWorkflowStatus(WORKFLOW_STATUS.COMPLETED)).toBe(true)
    expect(isSelectableWorkflowStatus(OVERDUE_LABEL)).toBe(false)
  })
})
