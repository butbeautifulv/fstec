import { describe, expect, it } from "vitest"
import {
  deserializeDashboardScope,
  dashboardCacheKey,
  serializeDashboardScope,
} from "@/lib/dashboard/scope-key"

describe("serializeDashboardScope", () => {
  it("serializes global scope", () => {
    expect(serializeDashboardScope({ type: "global" })).toBe("global")
  })

  it("serializes organization scope with date range", () => {
    expect(
      serializeDashboardScope({
        type: "organization",
        organizationId: 5,
        issuedFrom: new Date("2024-01-01T00:00:00.000Z"),
        issuedTo: new Date("2024-12-31T00:00:00.000Z"),
      })
    ).toBe("organization:5|2024-01-01|2024-12-31")
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

describe("deserializeDashboardScope", () => {
  it("round-trips date range", () => {
    const scope = deserializeDashboardScope("global|2024-06-01|2024-06-30")
    expect(scope.type).toBe("global")
    expect(scope.issuedFrom?.toISOString().slice(0, 10)).toBe("2024-06-01")
    expect(scope.issuedTo?.toISOString().slice(0, 10)).toBe("2024-06-30")
  })
})

describe("dashboardCacheKey", () => {
  it("includes scope and dates", () => {
    expect(dashboardCacheKey({ type: "global" })).toBe("dashboard:global")
    expect(
      dashboardCacheKey({
        type: "organization",
        organizationId: 3,
        issuedFrom: new Date("2024-01-01T00:00:00.000Z"),
      })
    ).toBe("dashboard:organization:3|2024-01-01|")
  })
})
