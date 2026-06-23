import { describe, expect, it } from "vitest"
import {
  canHideChartCategory,
  defaultVisibleChartStatuses,
  filterStatusDistribution,
  hiddenChartStatusCount,
  isChartStatusVisible,
  setVisibleChartStatuses,
  sumVisibleBreakdown,
  sumVisibleBreakdownRows,
  toggleChartCategoryVisibility,
  visibleBreakdownGrandTotal,
  visibleStatusesInOrder,
} from "@/lib/dashboard/chart-visibility"
import type { StatusBreakdownRow } from "@/lib/dashboard/stats"
import {
  DASHBOARD_STATUS_ORDER,
  OVERDUE_LABEL,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"

const ORDER = DASHBOARD_STATUS_ORDER

describe("chart visibility", () => {
  it("starts with all statuses visible", () => {
    const visible = defaultVisibleChartStatuses(ORDER)
    expect(visible.size).toBe(3)
    expect(isChartStatusVisible(visible, WORKFLOW_STATUS.COMPLETED)).toBe(true)
  })

  it("hides a category when more than one visible", () => {
    const visible = defaultVisibleChartStatuses(ORDER)
    const next = toggleChartCategoryVisibility(
      visible,
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(isChartStatusVisible(next, WORKFLOW_STATUS.COMPLETED)).toBe(false)
    expect(next.size).toBe(2)
  })

  it("does not hide the last visible category", () => {
    let visible = defaultVisibleChartStatuses(ORDER)
    visible = toggleChartCategoryVisibility(
      visible,
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    visible = toggleChartCategoryVisibility(
      visible,
      WORKFLOW_STATUS.IN_PROGRESS,
      ORDER
    )
    expect(canHideChartCategory(visible)).toBe(false)
    const next = toggleChartCategoryVisibility(visible, OVERDUE_LABEL, ORDER)
    expect(next).toEqual(visible)
    expect(next.size).toBe(1)
  })

  it("shows a hidden category again", () => {
    const visible = toggleChartCategoryVisibility(
      defaultVisibleChartStatuses(ORDER),
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    const next = toggleChartCategoryVisibility(
      visible,
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(isChartStatusVisible(next, WORKFLOW_STATUS.COMPLETED)).toBe(true)
  })

  it("filters status distribution by visible categories", () => {
    const distribution = [
      { status: WORKFLOW_STATUS.IN_PROGRESS, count: 5, fill: "var(--chart-1)" },
      { status: WORKFLOW_STATUS.COMPLETED, count: 3, fill: "var(--chart-2)" },
    ]
    const visible = toggleChartCategoryVisibility(
      defaultVisibleChartStatuses(ORDER),
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(filterStatusDistribution(distribution, visible)).toEqual([
      distribution[0],
    ])
  })

  it("setVisibleChartStatuses keeps at least one category", () => {
    expect(setVisibleChartStatuses(new Set(), ORDER)).toEqual(
      new Set([ORDER[0]])
    )
    expect(
      setVisibleChartStatuses(
        new Set([WORKFLOW_STATUS.IN_PROGRESS]),
        ORDER
      )
    ).toEqual(new Set([WORKFLOW_STATUS.IN_PROGRESS]))
  })

  it("hiddenChartStatusCount reports hidden categories", () => {
    const visible = new Set([WORKFLOW_STATUS.IN_PROGRESS])
    expect(hiddenChartStatusCount(visible, ORDER)).toBe(2)
  })

  it("preserves order for visible stacked statuses", () => {
    const visible = toggleChartCategoryVisibility(
      defaultVisibleChartStatuses(ORDER),
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(visibleStatusesInOrder(ORDER, visible)).toEqual([
      WORKFLOW_STATUS.IN_PROGRESS,
      OVERDUE_LABEL,
    ])
  })

  it("sums only visible breakdown values", () => {
    const row: Omit<StatusBreakdownRow, "label"> = {
      [WORKFLOW_STATUS.IN_PROGRESS]: 2,
      [WORKFLOW_STATUS.COMPLETED]: 5,
      [OVERDUE_LABEL]: 1,
    }
    const visible = toggleChartCategoryVisibility(
      defaultVisibleChartStatuses(ORDER),
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(sumVisibleBreakdown(row, visible, ORDER)).toBe(3)
  })

  it("computes visible totals across rows", () => {
    const rows: StatusBreakdownRow[] = [
      {
        label: "A",
        [WORKFLOW_STATUS.IN_PROGRESS]: 1,
        [WORKFLOW_STATUS.COMPLETED]: 4,
        [OVERDUE_LABEL]: 0,
      },
      {
        label: "B",
        [WORKFLOW_STATUS.IN_PROGRESS]: 2,
        [WORKFLOW_STATUS.COMPLETED]: 1,
        [OVERDUE_LABEL]: 3,
      },
    ]
    const visible = toggleChartCategoryVisibility(
      defaultVisibleChartStatuses(ORDER),
      WORKFLOW_STATUS.COMPLETED,
      ORDER
    )
    expect(sumVisibleBreakdownRows(rows, visible, ORDER)).toEqual({
      [WORKFLOW_STATUS.IN_PROGRESS]: 3,
      [WORKFLOW_STATUS.COMPLETED]: 0,
      [OVERDUE_LABEL]: 3,
    })
    expect(visibleBreakdownGrandTotal(rows, visible, ORDER)).toBe(6)
  })
})
