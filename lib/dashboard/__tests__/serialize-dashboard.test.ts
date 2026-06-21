import { describe, expect, it } from "vitest"
import {
  dashboardShowsEmptyInteractive,
  toDashboardInteractiveProps,
} from "@/lib/dashboard/interactive-props"
import { dashboardMatrixLinkTargets } from "@/lib/dashboard/link-targets"
import { serializeDashboardDto } from "@/lib/dashboard/serialize-dashboard"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import { getDashboardVariantConfig } from "@/lib/dashboard/variant-config"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const stats: ScopedDashboardStats = {
  scope: "global",
  statusDistribution: [],
  overdueBreakdown: [],
  statusBreakdown: [],
  chartLabels: {
    overdueTitle: "Overdue",
    completionTitle: "Completion",
  },
}

const matrixItem = {
  id: 1,
  orderId: 10,
  dueAt: new Date("2024-06-01T00:00:00.000Z"),
  isOverdue: false,
  measure: { id: 5, name: "M", code: "C", description: null },
  order: {
    title: "Order",
    issuedAt: new Date("2024-01-01T00:00:00.000Z"),
    organization: { id: 2, name: "Org" },
  },
  status: { id: 1, name: WORKFLOW_STATUS.NOT_STARTED, isTerminal: false },
  subdivision: { id: 3, name: "Sub" },
}

describe("serializeDashboardDto", () => {
  it("serializes matrix items with ISO dates", () => {
    const dto = serializeDashboardDto({ stats, items: [matrixItem] })
    expect(dto.stats).toBe(stats)
    expect(dto.items).toEqual([
      {
        id: 1,
        orderId: 10,
        dueAt: "2024-06-01T00:00:00.000Z",
        isOverdue: false,
        measure: { id: 5, name: "M", code: "C", description: null },
        order: {
          title: "Order",
          issuedAt: "2024-01-01T00:00:00.000Z",
          organization: { id: 2, name: "Org" },
        },
        status: { id: 1, name: WORKFLOW_STATUS.NOT_STARTED, isTerminal: false },
        subdivision: { id: 3, name: "Sub" },
      },
    ])
  })

  it("limits items when limit option is set", () => {
    const dto = serializeDashboardDto(
      { stats, items: [matrixItem, { ...matrixItem, id: 2 }] },
      { limit: 1 }
    )
    expect(dto.items).toHaveLength(1)
    expect(dto.items[0]?.id).toBe(1)
  })

  it("ignores non-positive limit", () => {
    const dto = serializeDashboardDto(
      { stats, items: [matrixItem, { ...matrixItem, id: 2 }] },
      { limit: 0 }
    )
    expect(dto.items).toHaveLength(2)
  })

  it("normalizes null subdivision to null", () => {
    const dto = serializeDashboardDto({
      stats,
      items: [{ ...matrixItem, subdivision: null }],
    })
    expect(dto.items[0]?.subdivision).toBeNull()
  })
})

describe("toDashboardInteractiveProps", () => {
  it("builds platform props with default scope", () => {
    const props = toDashboardInteractiveProps(
      { variant: "platform", items: [] },
      stats,
      false
    )
    expect(props).toEqual({
      variant: "platform",
      scope: "global",
      stats,
      items: [],
      overdueOnly: false,
    })
  })

  it("builds platform props with explicit scope", () => {
    const props = toDashboardInteractiveProps(
      { variant: "platform", scope: "organization", items: [] },
      stats,
      true
    )
    expect(props).toMatchObject({ scope: "organization", overdueOnly: true })
  })

  it("builds report props", () => {
    const props = toDashboardInteractiveProps(
      { variant: "report", token: "tok", items: [] },
      stats,
      false
    )
    expect(props).toEqual({
      variant: "report",
      scope: "global",
      stats,
      token: "tok",
      items: [],
      overdueOnly: false,
    })
  })

  it("builds public props", () => {
    const publicItem = {
      id: 1,
      orderId: 1,
      dueAt: "2024-01-01T00:00:00.000Z",
      measure: { name: "M", code: null, description: null },
      status: { id: 1, name: "К исполнению", isTerminal: false },
      orderTitle: "O",
      orderIssuedAt: "2024-01-01T00:00:00.000Z",
      subdivisionName: null,
    }
    const statuses = [{ id: 1, name: "К исполнению", isTerminal: false }]

    const props = toDashboardInteractiveProps(
      {
        variant: "public",
        token: "pub",
        items: [publicItem],
        statuses,
        scope: "organization",
        showSubdivisionColumn: true,
      },
      stats,
      false
    )
    expect(props).toEqual({
      variant: "public",
      scope: "organization",
      stats,
      token: "pub",
      items: [publicItem],
      statuses,
      showSubdivisionColumn: true,
      overdueOnly: false,
    })
  })
})

describe("dashboardShowsEmptyInteractive", () => {
  it("returns true for public variant regardless of count", () => {
    expect(dashboardShowsEmptyInteractive("public", 0)).toBe(true)
    expect(dashboardShowsEmptyInteractive("public", 5)).toBe(true)
  })

  it("returns true for platform/report when items exist", () => {
    expect(dashboardShowsEmptyInteractive("platform", 1)).toBe(true)
    expect(dashboardShowsEmptyInteractive("report", 3)).toBe(true)
  })

  it("returns false for platform/report with zero items", () => {
    expect(dashboardShowsEmptyInteractive("platform", 0)).toBe(false)
    expect(dashboardShowsEmptyInteractive("report", 0)).toBe(false)
  })
})

describe("dashboardMatrixLinkTargets", () => {
  it("returns platform panel links", () => {
    const targets = dashboardMatrixLinkTargets("platform")
    expect(targets.organization(2)).toBe("/panel/organizations/2")
    expect(targets.order(10)).toBe("/panel/orders/10")
    expect(
      targets.measure({
        id: 1,
        orderId: 1,
        dueAt: "",
        isOverdue: false,
        measure: { id: 5, name: "M", code: null, description: null },
        order: {
          title: "O",
          issuedAt: "",
          organization: { id: 1, name: "Org" },
        },
        status: { id: 1, name: "S", isTerminal: false },
      })
    ).toBe("/panel/measures/5/edit")
  })

  it("returns report links with token", () => {
    const targets = dashboardMatrixLinkTargets("report", "abc123")
    expect(targets.organization(2)).toBe("/report/abc123/organizations/2")
    expect(targets.order(10)).toBe("/report/abc123/orders/10")
    expect(
      targets.measure({
        id: 99,
        orderId: 1,
        dueAt: "",
        isOverdue: false,
        measure: { id: 5, name: "M", code: null, description: null },
        order: {
          title: "O",
          issuedAt: "",
          organization: { id: 1, name: "Org" },
        },
        status: { id: 1, name: "S", isTerminal: false },
      })
    ).toBe("/report/abc123/items/99")
  })

  it("throws when report variant lacks token", () => {
    expect(() => dashboardMatrixLinkTargets("report")).toThrow(
      "Report dashboard matrix requires token"
    )
  })
})

describe("getDashboardVariantConfig", () => {
  it("returns platform config", () => {
    expect(getDashboardVariantConfig("platform")).toEqual({
      variant: "platform",
      tableKind: "matrix",
      needsStatuses: false,
      needsToken: false,
      defaultScope: "global",
      suspenseChartsDefault: true,
    })
  })

  it("returns public config", () => {
    expect(getDashboardVariantConfig("public")).toMatchObject({
      variant: "public",
      tableKind: "measures",
      needsStatuses: true,
      needsToken: true,
      defaultScope: "organization",
    })
  })

  it("returns report config", () => {
    expect(getDashboardVariantConfig("report")).toMatchObject({
      variant: "report",
      tableKind: "matrix",
      needsToken: true,
      defaultScope: "global",
    })
  })
})
