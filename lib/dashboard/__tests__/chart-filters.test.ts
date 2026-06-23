import type { ColumnFiltersState } from "@tanstack/react-table"
import { describe, expect, it } from "vitest"
import { buildMatrixFromItems } from "@/lib/dashboard/build-matrix"
import type { ScopedDashboardItem } from "@/lib/dashboard/fetch-scoped-items"
import {
  breakdownColumnId,
  hasChartLinkedFilters,
  isBreakdownFilterActive,
  isCompletionSegmentActive,
  isDashboardStatusFilterActive,
  isOverdueSegmentHighlighted,
  isStatusBreakdownActive,
  isStatusFilterActive,
  isStatusSegmentHighlighted,
  overdueInitialFilters,
  toggleBreakdownFilter,
  toggleCompletionSegmentFilter,
  toggleOverdueSegmentFilter,
  toggleStatusBreakdownFilter,
  toggleStatusFilter,
  toggleStatusFilterPreserveBreakdown,
} from "@/lib/dashboard/chart-filters"
import { OVERDUE_LABEL, WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const NOW = new Date("2024-06-15T12:00:00.000Z")

function makeItem(overrides: Partial<ScopedDashboardItem> = {}): ScopedDashboardItem {
  return {
    id: 1,
    orderId: 1,
    dueAt: new Date("2099-01-01T00:00:00.000Z"),
    subdivisionId: null,
    status: { id: 1, name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
    measure: { id: 1, name: "M", code: null, description: null },
    subdivision: null,
    order: {
      id: 1,
      title: "Order",
      issuedAt: new Date("2024-01-01T00:00:00.000Z"),
      organizationId: 1,
      organization: { id: 1, name: "Org" },
    },
    ...overrides,
  } as ScopedDashboardItem
}

describe("buildMatrixFromItems", () => {
  it("builds matrix rows with overdue flag", () => {
    const items = [
      makeItem({ id: 1, dueAt: new Date("2099-01-01T00:00:00.000Z") }),
      makeItem({
        id: 2,
        dueAt: new Date("2020-01-01T00:00:00.000Z"),
        status: { id: 2, name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
      }),
    ]

    const matrix = buildMatrixFromItems(items, NOW)
    expect(matrix).toHaveLength(2)
    expect(matrix[0]?.isOverdue).toBe(false)
    expect(matrix[1]?.isOverdue).toBe(true)
    expect(matrix[0]?.order.organization.name).toBe("Org")
  })
})

describe("breakdownColumnId", () => {
  it("returns column id per scope", () => {
    expect(breakdownColumnId("global")).toBe("organization")
    expect(breakdownColumnId("organization")).toBe("subdivisionName")
    expect(breakdownColumnId("subdivision")).toBe("orderTitle")
  })
})

describe("overdueInitialFilters", () => {
  it("filters by overdue status", () => {
    expect(overdueInitialFilters()).toEqual([
      { id: "status", value: [OVERDUE_LABEL] },
    ])
  })
})

describe("toggleOverdueSegmentFilter", () => {
  it("sets breakdown and status for overdue segment", () => {
    const next = toggleOverdueSegmentFilter([], "global", "Org A", "overdue")
    expect(next).toEqual([
      { id: "organization", value: ["Org A"] },
      { id: "status", value: [OVERDUE_LABEL] },
    ])
  })

  it("sets in-progress status for inProgress segment", () => {
    const next = toggleOverdueSegmentFilter([], "organization", "IT", "inProgress")
    expect(next).toEqual([
      { id: "subdivisionName", value: ["IT"] },
      { id: "status", value: [WORKFLOW_STATUS.IN_PROGRESS] },
    ])
  })

  it("sets completed status for completed segment", () => {
    const next = toggleOverdueSegmentFilter([], "organization", "IT", "completed")
    expect(next).toEqual([
      { id: "subdivisionName", value: ["IT"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ])
  })

  it("clears filters when toggling same segment again", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org A"] },
      { id: "status", value: [OVERDUE_LABEL] },
    ]
    expect(toggleOverdueSegmentFilter(filters, "global", "Org A", "overdue")).toEqual(
      []
    )
  })

  it("clears in-progress segment when toggling same combination again", () => {
    const filters: ColumnFiltersState = [
      { id: "subdivisionName", value: ["IT"] },
      { id: "status", value: [WORKFLOW_STATUS.IN_PROGRESS] },
    ]
    expect(
      toggleOverdueSegmentFilter(filters, "organization", "IT", "inProgress")
    ).toEqual([])
  })
})

describe("toggleStatusFilter", () => {
  it("sets status filter and clears breakdown filters", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      { id: "status", value: [OVERDUE_LABEL] },
    ]
    const next = toggleStatusFilter(filters, WORKFLOW_STATUS.COMPLETED)
    expect(next).toEqual([{ id: "status", value: [WORKFLOW_STATUS.COMPLETED] }])
  })

  it("clears status when toggling same value", () => {
    const filters: ColumnFiltersState = [
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ]
    expect(toggleStatusFilter(filters, WORKFLOW_STATUS.COMPLETED)).toEqual([])
  })

  it("replaces status when toggling different value", () => {
    const filters: ColumnFiltersState = [
      { id: "status", value: [WORKFLOW_STATUS.IN_PROGRESS] },
    ]
    expect(toggleStatusFilter(filters, WORKFLOW_STATUS.COMPLETED)).toEqual([
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ])
  })
})

describe("toggleStatusFilterPreserveBreakdown", () => {
  it("preserves breakdown filters when toggling status", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
    ]
    const next = toggleStatusFilterPreserveBreakdown(
      filters,
      WORKFLOW_STATUS.IN_PROGRESS
    )
    expect(next).toEqual([
      { id: "organization", value: ["Org"] },
      { id: "status", value: [WORKFLOW_STATUS.IN_PROGRESS] },
    ])
  })

  it("clears status when toggling same value while preserving breakdown", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ]
    expect(toggleStatusFilterPreserveBreakdown(filters, WORKFLOW_STATUS.COMPLETED)).toEqual([
      { id: "organization", value: ["Org"] },
    ])
  })
})

describe("toggleBreakdownFilter", () => {
  it("sets breakdown filter and clears status", () => {
    const filters: ColumnFiltersState = [
      { id: "status", value: [OVERDUE_LABEL] },
    ]
    const next = toggleBreakdownFilter(filters, "global", "Org A")
    expect(next).toEqual([{ id: "organization", value: ["Org A"] }])
  })

  it("clears breakdown when toggling same label", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org A"] },
    ]
    expect(toggleBreakdownFilter(filters, "global", "Org A")).toEqual([])
  })
})

describe("toggleStatusBreakdownFilter", () => {
  it("sets combined breakdown and status filters", () => {
    const next = toggleStatusBreakdownFilter(
      [],
      "subdivision",
      "Order X",
      WORKFLOW_STATUS.COMPLETED
    )
    expect(next).toEqual([
      { id: "orderTitle", value: ["Order X"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ])
  })

  it("clears when same combination is active", () => {
    const filters: ColumnFiltersState = [
      { id: "orderTitle", value: ["Order X"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ]
    expect(
      toggleStatusBreakdownFilter(
        filters,
        "subdivision",
        "Order X",
        WORKFLOW_STATUS.COMPLETED
      )
    ).toEqual([])
  })
})

describe("toggleCompletionSegmentFilter", () => {
  it("sets completed segment filters", () => {
    const next = toggleCompletionSegmentFilter([], "global", "Org", "completed")
    expect(next).toEqual([
      { id: "organization", value: ["Org"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ])
  })

  it("sets active segment with multiple statuses", () => {
    const next = toggleCompletionSegmentFilter([], "global", "Org", "active")
    expect(next[1]?.value).toEqual([WORKFLOW_STATUS.IN_PROGRESS, OVERDUE_LABEL])
  })

  it("clears completed segment when toggling same combination again", () => {
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ]
    expect(toggleCompletionSegmentFilter(filters, "global", "Org", "completed")).toEqual(
      []
    )
  })

  it("clears active segment when toggling same combination again", () => {
    const activeStatuses = [WORKFLOW_STATUS.IN_PROGRESS, OVERDUE_LABEL]
    const filters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      { id: "status", value: activeStatuses },
    ]
    expect(toggleCompletionSegmentFilter(filters, "global", "Org", "active")).toEqual([])
  })
})

describe("filter active helpers", () => {
  const filters: ColumnFiltersState = [
    { id: "organization", value: ["Org A"] },
    { id: "status", value: [OVERDUE_LABEL] },
  ]

  it("isStatusFilterActive", () => {
    expect(isStatusFilterActive(filters, OVERDUE_LABEL)).toBe(true)
    expect(isStatusFilterActive(filters, WORKFLOW_STATUS.COMPLETED)).toBe(false)
  })

  it("isBreakdownFilterActive", () => {
    expect(isBreakdownFilterActive(filters, "global", "Org A")).toBe(true)
    expect(isBreakdownFilterActive(filters, "global", "Org B")).toBe(false)
  })

  it("isOverdueSegmentHighlighted with both filters", () => {
    expect(
      isOverdueSegmentHighlighted(filters, "global", "Org A", "overdue")
    ).toBe(true)
  })

  it("isOverdueSegmentHighlighted with breakdown only", () => {
    const breakdownOnly: ColumnFiltersState = [{ id: "organization", value: ["Org A"] }]
    expect(
      isOverdueSegmentHighlighted(breakdownOnly, "global", "Org A", "overdue")
    ).toBe(true)
    expect(
      isOverdueSegmentHighlighted(breakdownOnly, "global", "Org B", "overdue")
    ).toBe(false)
  })

  it("isOverdueSegmentHighlighted with status only", () => {
    const statusOnly: ColumnFiltersState = [{ id: "status", value: [OVERDUE_LABEL] }]
    expect(isOverdueSegmentHighlighted(statusOnly, "global", "Org A", "overdue")).toBe(
      true
    )
  })

  it("isOverdueSegmentHighlighted returns false with no matching filters", () => {
    expect(isOverdueSegmentHighlighted([], "global", "Org A", "overdue")).toBe(false)
  })

  it("isStatusBreakdownActive", () => {
    expect(
      isStatusBreakdownActive(filters, "global", "Org A", OVERDUE_LABEL)
    ).toBe(true)
  })

  it("isStatusSegmentHighlighted", () => {
    expect(
      isStatusSegmentHighlighted(filters, "global", "Org A", OVERDUE_LABEL)
    ).toBe(true)
  })

  it("isStatusSegmentHighlighted with partial filters", () => {
    const breakdownOnly: ColumnFiltersState = [{ id: "organization", value: ["Org A"] }]
    const statusOnly: ColumnFiltersState = [{ id: "status", value: [OVERDUE_LABEL] }]
    expect(
      isStatusSegmentHighlighted(breakdownOnly, "global", "Org A", OVERDUE_LABEL)
    ).toBe(true)
    expect(
      isStatusSegmentHighlighted(statusOnly, "global", "Org A", OVERDUE_LABEL)
    ).toBe(true)
    expect(isStatusSegmentHighlighted([], "global", "Org A", OVERDUE_LABEL)).toBe(false)
  })

  it("isCompletionSegmentActive", () => {
    const completedFilters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      { id: "status", value: [WORKFLOW_STATUS.COMPLETED] },
    ]
    expect(
      isCompletionSegmentActive(completedFilters, "global", "Org", "completed")
    ).toBe(true)
  })

  it("isCompletionSegmentActive for active segment", () => {
    const activeFilters: ColumnFiltersState = [
      { id: "organization", value: ["Org"] },
      {
        id: "status",
        value: [WORKFLOW_STATUS.IN_PROGRESS, OVERDUE_LABEL],
      },
    ]
    expect(isCompletionSegmentActive(activeFilters, "global", "Org", "active")).toBe(
      true
    )
  })

  it("hasChartLinkedFilters detects breakdown columns", () => {
    expect(hasChartLinkedFilters([{ id: "subdivisionName", value: ["IT"] }])).toBe(
      true
    )
    expect(hasChartLinkedFilters([{ id: "orderTitle", value: ["Order X"] }])).toBe(
      true
    )
  })

  it("hasChartLinkedFilters", () => {
    expect(hasChartLinkedFilters(filters)).toBe(true)
    expect(hasChartLinkedFilters([])).toBe(false)
  })

  it("isDashboardStatusFilterActive matches in progress filter", () => {
    const inProgressFilters: ColumnFiltersState = [
      {
        id: "status",
        value: [WORKFLOW_STATUS.IN_PROGRESS],
      },
    ]
    expect(
      isDashboardStatusFilterActive(inProgressFilters, WORKFLOW_STATUS.IN_PROGRESS)
    ).toBe(true)
    expect(
      isDashboardStatusFilterActive(inProgressFilters, WORKFLOW_STATUS.COMPLETED)
    ).toBe(false)
  })
})
