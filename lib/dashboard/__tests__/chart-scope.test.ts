import { describe, expect, it } from "vitest"
import {
  chartScopeFromDashboardScope,
  publicShowsSubdivisionColumn,
} from "@/lib/dashboard/chart-scope"

describe("chartScopeFromDashboardScope", () => {
  it("mirrors scope.type", () => {
    expect(chartScopeFromDashboardScope({ type: "global" })).toBe("global")
    expect(
      chartScopeFromDashboardScope({ type: "organization", organizationId: 7 })
    ).toBe("organization")
    expect(
      chartScopeFromDashboardScope({
        type: "subdivision",
        organizationId: 7,
        subdivisionId: 49,
      })
    ).toBe("subdivision")
  })
})

describe("publicShowsSubdivisionColumn", () => {
  it("is true only for organization scope", () => {
    expect(publicShowsSubdivisionColumn({ type: "global" })).toBe(false)
    expect(
      publicShowsSubdivisionColumn({ type: "organization", organizationId: 1 })
    ).toBe(true)
    expect(
      publicShowsSubdivisionColumn({
        type: "subdivision",
        organizationId: 1,
        subdivisionId: 2,
      })
    ).toBe(false)
  })
})
