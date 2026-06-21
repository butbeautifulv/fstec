import { describe, expect, it } from "vitest"
import type { ScopedDashboardItem } from "@/lib/dashboard/fetch-scoped-items"
import {
  buildScopedStatsFromItems,
  scopeFromAccessLink,
} from "@/lib/dashboard/stats"
import {
  OVERDUE_LABEL,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"

const NOW = new Date("2024-06-15T12:00:00.000Z")

function makeItem(
  overrides: Partial<ScopedDashboardItem> & {
    statusName?: string
    isTerminal?: boolean
    dueAt?: Date
    orgName?: string
    subName?: string | null
    orderTitle?: string
  } = {}
): ScopedDashboardItem {
  return {
    id: overrides.id ?? 1,
    orderId: overrides.orderId ?? 1,
    dueAt: overrides.dueAt ?? new Date("2099-01-01T00:00:00.000Z"),
    subdivisionId: overrides.subdivisionId ?? null,
    status: {
      id: 1,
      name: overrides.statusName ?? WORKFLOW_STATUS.NOT_STARTED,
      isTerminal: overrides.isTerminal ?? false,
    },
    measure: {
      id: 1,
      name: "Measure",
      code: null,
      description: null,
    },
    subdivision: overrides.subName
      ? { id: 1, name: overrides.subName }
      : overrides.subName === null
        ? null
        : null,
    order: {
      id: 1,
      title: overrides.orderTitle ?? "Order A",
      issuedAt: new Date("2024-01-01T00:00:00.000Z"),
      organizationId: 1,
      organization: { id: 1, name: overrides.orgName ?? "Org Alpha" },
    },
    ...overrides,
  } as ScopedDashboardItem
}

describe("buildScopedStatsFromItems", () => {
  describe("global scope", () => {
    it("aggregates by organization", () => {
      const items = [
        makeItem({
          id: 1,
          orgName: "Org A",
          statusName: WORKFLOW_STATUS.COMPLETED,
          isTerminal: true,
        }),
        makeItem({
          id: 2,
          orgName: "Org A",
          statusName: WORKFLOW_STATUS.IN_PROGRESS,
          dueAt: new Date("2020-01-01T00:00:00.000Z"),
        }),
        makeItem({
          id: 3,
          orgName: "Org B",
          statusName: WORKFLOW_STATUS.NOT_STARTED,
        }),
      ]

      const stats = buildScopedStatsFromItems({ type: "global" }, items, NOW)

      expect(stats.scope).toBe("global")
      expect(stats.chartLabels).toEqual({
        overdueTitle: "Просроченные по организациям",
        completionTitle: "Выполнение по организациям",
      })

      const orgAOverdue = stats.overdueBreakdown.find((r) => r.label === "Org A")
      expect(orgAOverdue).toEqual({ label: "Org A", count: 1, total: 2 })

      const orgBOverdue = stats.overdueBreakdown.find((r) => r.label === "Org B")
      expect(orgBOverdue).toEqual({ label: "Org B", count: 0, total: 1 })

      const orgAStatus = stats.statusBreakdown.find((r) => r.label === "Org A")
      expect(orgAStatus?.[WORKFLOW_STATUS.COMPLETED]).toBe(1)
      expect(orgAStatus?.[OVERDUE_LABEL]).toBe(1)

      expect(stats.statusDistribution.map((d) => d.status)).toEqual([
        WORKFLOW_STATUS.NOT_STARTED,
        WORKFLOW_STATUS.COMPLETED,
        OVERDUE_LABEL,
      ])
    })

    it("includes unknown statuses as extras in distribution", () => {
      const items = [
        makeItem({
          id: 1,
          statusName: "Legacy status",
          isTerminal: false,
        }),
        makeItem({
          id: 2,
          statusName: WORKFLOW_STATUS.NOT_STARTED,
        }),
      ]

      const stats = buildScopedStatsFromItems({ type: "global" }, items, NOW)
      const unknown = stats.statusDistribution.find((d) => d.status === "Legacy status")
      expect(unknown).toEqual({
        status: "Legacy status",
        count: 1,
        fill: expect.any(String),
      })
    })
  })

  describe("organization scope", () => {
    it("aggregates by subdivision", () => {
      const items = [
        makeItem({
          id: 1,
          subName: "IT",
          statusName: WORKFLOW_STATUS.IN_PROGRESS,
        }),
        makeItem({
          id: 2,
          subName: null,
          statusName: WORKFLOW_STATUS.NOT_STARTED,
        }),
      ]

      const stats = buildScopedStatsFromItems(
        { type: "organization", organizationId: 1 },
        items,
        NOW
      )

      expect(stats.scope).toBe("organization")
      expect(stats.chartLabels.overdueTitle).toBe("Просроченные по подразделениям")
      expect(stats.overdueBreakdown.map((r) => r.label)).toContain("IT")
      expect(stats.overdueBreakdown.map((r) => r.label)).toContain("Без подразделения")
    })
  })

  describe("subdivision scope", () => {
    it("aggregates by order title", () => {
      const items = [
        makeItem({
          id: 1,
          orderTitle: "Order X",
          statusName: WORKFLOW_STATUS.COMPLETED,
          isTerminal: true,
        }),
        makeItem({
          id: 2,
          orderTitle: "Order Y",
          dueAt: new Date("2020-01-01T00:00:00.000Z"),
          statusName: WORKFLOW_STATUS.IN_PROGRESS,
        }),
      ]

      const stats = buildScopedStatsFromItems(
        { type: "subdivision", organizationId: 1, subdivisionId: 2 },
        items,
        NOW
      )

      expect(stats.scope).toBe("subdivision")
      expect(stats.chartLabels.overdueTitle).toBe("Просроченные по поручениям")
      expect(stats.overdueBreakdown.find((r) => r.label === "Order Y")?.count).toBe(1)
    })
  })

  it("returns empty breakdowns for no items", () => {
    const stats = buildScopedStatsFromItems({ type: "global" }, [], NOW)
    expect(stats.statusDistribution).toEqual([])
    expect(stats.overdueBreakdown).toEqual([])
    expect(stats.statusBreakdown).toEqual([])
  })
})

describe("scopeFromAccessLink", () => {
  it("returns organization scope when subdivisionId is null", () => {
    expect(scopeFromAccessLink({ organizationId: 5, subdivisionId: null })).toEqual({
      type: "organization",
      organizationId: 5,
    })
  })

  it("returns subdivision scope when subdivisionId is set", () => {
    expect(scopeFromAccessLink({ organizationId: 5, subdivisionId: 12 })).toEqual({
      type: "subdivision",
      organizationId: 5,
      subdivisionId: 12,
    })
  })
})
