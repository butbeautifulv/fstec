import { beforeEach, describe, expect, it, vi } from "vitest"
import { OVERDUE_LABEL, WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const mockGetScopedDashboard = vi.hoisted(() => vi.fn())

vi.mock("@/lib/dashboard/get-scoped-dashboard", () => ({
  getScopedDashboard: mockGetScopedDashboard,
}))

import { getDashboardStats, getScopedDashboardStats } from "@/lib/dashboard/stats"

const scopedStats = {
  scope: "global" as const,
  statusDistribution: [{ status: WORKFLOW_STATUS.COMPLETED, count: 2, fill: "var(--chart-1)" }],
  overdueBreakdown: [{ label: "Org A", count: 1, total: 3 }],
  statusBreakdown: [
    {
      label: "Org A",
      [WORKFLOW_STATUS.IN_PROGRESS]: 0,
      [WORKFLOW_STATUS.COMPLETED]: 2,
      [OVERDUE_LABEL]: 0,
    },
  ],
  chartLabels: {
    overdueTitle: "Просроченные по организациям",
    completionTitle: "Выполнение по организациям",
  },
}

describe("getScopedDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetScopedDashboard.mockResolvedValue({ stats: scopedStats, items: [] })
  })

  it("returns stats from scoped dashboard", async () => {
    const scope = { type: "organization" as const, organizationId: 5 }
    const stats = await getScopedDashboardStats(scope)
    expect(mockGetScopedDashboard).toHaveBeenCalledWith(scope)
    expect(stats).toEqual(scopedStats)
  })
})

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetScopedDashboard.mockResolvedValue({ stats: scopedStats, items: [] })
  })

  it("maps scoped stats to legacy dashboard shape", async () => {
    const legacy = await getDashboardStats()
    expect(mockGetScopedDashboard).toHaveBeenCalledWith({ type: "global" })
    expect(legacy.statusDistribution).toEqual(scopedStats.statusDistribution)
    expect(legacy.overdueByOrganization).toEqual([{ org: "Org A", count: 1 }])
    expect(legacy.completionByOrganization).toEqual([
      {
        org: "Org A",
        completed: 2,
        active: 0,
      },
    ])
  })
})
