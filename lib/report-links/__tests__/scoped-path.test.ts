import { describe, expect, it } from "vitest"
import {
  dashboardScopeForLinkRow,
  reportScopedDashboardPath,
  reportSharePath,
} from "@/lib/report-links/scoped-path"

describe("reportSharePath", () => {
  it("builds entry share URL", () => {
    expect(reportSharePath("abc123")).toBe("/report/abc123")
  })
})

describe("reportScopedDashboardPath", () => {
  const token = "abc123"

  it("builds global report path", () => {
    expect(reportScopedDashboardPath(token, { type: "global" })).toBe(`/report/${token}`)
  })

  it("builds organization report path", () => {
    expect(
      reportScopedDashboardPath(token, { type: "organization", organizationId: 7 })
    ).toBe(`/report/${token}/organizations/7/dashboard`)
  })

  it("builds subdivision report path", () => {
    expect(
      reportScopedDashboardPath(token, {
        type: "subdivision",
        organizationId: 7,
        subdivisionId: 49,
      })
    ).toBe(`/report/${token}/organizations/7/subdivisions/49/dashboard`)
  })
})

describe("dashboardScopeForLinkRow", () => {
  it("maps link scope rows to dashboard scope", () => {
    expect(dashboardScopeForLinkRow({ kind: "report" })).toEqual({ type: "global" })
    expect(
      dashboardScopeForLinkRow({ kind: "organization", organizationId: 3 })
    ).toEqual({ type: "organization", organizationId: 3 })
    expect(
      dashboardScopeForLinkRow({
        kind: "subdivision",
        organizationId: 3,
        subdivisionId: 9,
      })
    ).toEqual({ type: "subdivision", organizationId: 3, subdivisionId: 9 })
  })
})
