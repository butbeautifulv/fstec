import { describe, expect, it } from "vitest"
import {
  dashboardLinkTargets,
  dashboardPublicLinkTargets,
} from "@/lib/dashboard/link-targets"

describe("dashboardPublicLinkTargets", () => {
  it("includes subdivision href for organization scope", () => {
    const targets = dashboardPublicLinkTargets("tok", {
      type: "organization",
      organizationId: 7,
    })
    expect(targets.basePath).toBe("/p/tok")
    expect(targets.subdivisionHref?.(49)).toBe("/p/tok/subdivisions/49")
  })

  it("omits subdivision href for subdivision scope", () => {
    const targets = dashboardPublicLinkTargets("tok", {
      type: "subdivision",
      organizationId: 7,
      subdivisionId: 49,
    })
    expect(targets.subdivisionHref).toBeUndefined()
  })
})

describe("dashboardLinkTargets", () => {
  it("dispatches public variant", () => {
    const targets = dashboardLinkTargets("public", {
      token: "tok",
      scope: { type: "organization", organizationId: 1 },
    })
    expect(targets).toMatchObject({ basePath: "/p/tok" })
  })
})
