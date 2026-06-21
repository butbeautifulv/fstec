import { describe, expect, it } from "vitest"
import {
  buildDashboardPageProps,
  dashboardBaseHref,
} from "@/lib/dashboard/build-dashboard-page-props"

describe("dashboardBaseHref", () => {
  it("builds platform hrefs by scope", () => {
    expect(dashboardBaseHref("platform", { type: "global" })).toBe("/panel")
    expect(
      dashboardBaseHref("platform", { type: "organization", organizationId: 7 })
    ).toBe("/panel/organizations/7/dashboard")
    expect(
      dashboardBaseHref("platform", {
        type: "subdivision",
        organizationId: 7,
        subdivisionId: 49,
      })
    ).toBe("/panel/organizations/7/subdivisions/49/dashboard")
  })

  it("builds report hrefs with token", () => {
    expect(dashboardBaseHref("report", { type: "global" }, "tok")).toBe("/report/tok")
    expect(
      dashboardBaseHref(
        "report",
        { type: "organization", organizationId: 7 },
        "tok"
      )
    ).toBe("/report/tok/organizations/7/dashboard")
  })

  it("builds public hrefs with token", () => {
    expect(dashboardBaseHref("public", { type: "organization", organizationId: 7 }, "tok")).toBe(
      "/p/tok"
    )
    expect(
      dashboardBaseHref(
        "public",
        { type: "subdivision", organizationId: 7, subdivisionId: 49 },
        "tok"
      )
    ).toBe("/p/tok/subdivisions/49")
  })
})

describe("buildDashboardPageProps", () => {
  it("returns platform props without chartScope", () => {
    const props = buildDashboardPageProps({
      variant: "platform",
      scope: { type: "global" },
      title: "Сводка",
      description: "desc",
      overdueOnly: false,
      emptyMessage: "empty",
    })
    expect(props.variant).toBe("platform")
    expect(props.baseHref).toBe("/panel")
    expect("chartScope" in props).toBe(false)
  })

  it("returns public props with token and statuses", () => {
    const props = buildDashboardPageProps({
      variant: "public",
      scope: { type: "organization", organizationId: 1 },
      token: "abc",
      statuses: [],
      title: "Org",
      description: "desc",
      overdueOnly: true,
      emptyMessage: "empty",
    })
    expect(props.variant).toBe("public")
    if (props.variant === "public") {
      expect(props.token).toBe("abc")
    }
    expect("publicScope" in props).toBe(false)
  })
})
