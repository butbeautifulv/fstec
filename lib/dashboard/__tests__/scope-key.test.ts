import { describe, expect, it } from "vitest"
import {
  dashboardCacheKey,
  serializeDashboardScope,
} from "@/lib/dashboard/scope-key"

describe("serializeDashboardScope", () => {
  it("serializes global scope", () => {
    expect(serializeDashboardScope({ type: "global" })).toBe("global")
  })

  it("serializes organization scope", () => {
    expect(
      serializeDashboardScope({ type: "organization", organizationId: 5 })
    ).toBe("organization:5")
  })

  it("serializes subdivision scope", () => {
    expect(
      serializeDashboardScope({
        type: "subdivision",
        organizationId: 5,
        subdivisionId: 12,
      })
    ).toBe("subdivision:5:12")
  })
})

describe("dashboardCacheKey", () => {
  it("builds cache keys per scope", () => {
    expect(dashboardCacheKey({ type: "global" })).toBe("dashboard:global")
    expect(
      dashboardCacheKey({ type: "organization", organizationId: 3 })
    ).toBe("dashboard:org:3")
    expect(
      dashboardCacheKey({
        type: "subdivision",
        organizationId: 3,
        subdivisionId: 9,
      })
    ).toBe("dashboard:sub:3:9")
  })
})
