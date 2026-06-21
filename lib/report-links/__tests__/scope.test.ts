import { describe, expect, it } from "vitest"
import {
  isOrderItemInReportScope,
  isOrganizationInReportScope,
  isReportScopeAllowed,
  reportLinkCreateData,
  reportLinkScopeWhere,
  scopeFromReportLink,
  scopeKeyFromReportLink,
} from "@/lib/report-links/scope"

describe("scopeFromReportLink", () => {
  it("maps null fields to global", () => {
    expect(scopeFromReportLink({ organizationId: null, subdivisionId: null })).toEqual({
      type: "global",
    })
  })

  it("maps org fields", () => {
    expect(scopeFromReportLink({ organizationId: 5, subdivisionId: null })).toEqual({
      type: "organization",
      organizationId: 5,
    })
  })

  it("maps subdivision fields", () => {
    expect(scopeFromReportLink({ organizationId: 5, subdivisionId: 12 })).toEqual({
      type: "subdivision",
      organizationId: 5,
      subdivisionId: 12,
    })
  })
})

describe("reportLinkScopeWhere", () => {
  it("builds global where", () => {
    expect(reportLinkScopeWhere({ type: "global" })).toEqual({
      organizationId: null,
      subdivisionId: null,
    })
  })

  it("builds organization where", () => {
    expect(reportLinkScopeWhere({ type: "organization", organizationId: 3 })).toEqual({
      organizationId: 3,
      subdivisionId: null,
    })
  })
})

describe("reportLinkCreateData", () => {
  it("builds subdivision create data", () => {
    expect(
      reportLinkCreateData({
        type: "subdivision",
        organizationId: 1,
        subdivisionId: 2,
      })
    ).toEqual({ organizationId: 1, subdivisionId: 2 })
  })
})

describe("isReportScopeAllowed", () => {
  const orgScope = { type: "organization" as const, organizationId: 5 }
  const subScope = {
    type: "subdivision" as const,
    organizationId: 5,
    subdivisionId: 12,
  }

  it("global link allows any scope", () => {
    expect(isReportScopeAllowed({ type: "global" }, orgScope)).toBe(true)
    expect(isReportScopeAllowed({ type: "global" }, subScope)).toBe(true)
  })

  it("org link allows org and its subdivisions", () => {
    expect(isReportScopeAllowed(orgScope, orgScope)).toBe(true)
    expect(isReportScopeAllowed(orgScope, subScope)).toBe(true)
    expect(
      isReportScopeAllowed(orgScope, { type: "organization", organizationId: 99 })
    ).toBe(false)
    expect(isReportScopeAllowed(orgScope, { type: "global" })).toBe(false)
  })

  it("sub link allows only its subdivision", () => {
    expect(isReportScopeAllowed(subScope, subScope)).toBe(true)
    expect(isReportScopeAllowed(subScope, orgScope)).toBe(false)
    expect(
      isReportScopeAllowed(subScope, {
        type: "subdivision",
        organizationId: 5,
        subdivisionId: 99,
      })
    ).toBe(false)
  })
})

describe("scopeKeyFromReportLink", () => {
  it("maps to public link scope keys", () => {
    expect(scopeKeyFromReportLink({ organizationId: null, subdivisionId: null })).toBe(
      "report"
    )
    expect(scopeKeyFromReportLink({ organizationId: 7, subdivisionId: null })).toBe("org:7")
    expect(scopeKeyFromReportLink({ organizationId: 7, subdivisionId: 49 })).toBe("sub:49")
  })
})

describe("entity scope checks", () => {
  it("checks order item scope", () => {
    const item = {
      subdivisionId: 12,
      order: { organization: { id: 5 } },
    }
    expect(
      isOrderItemInReportScope({ type: "subdivision", organizationId: 5, subdivisionId: 12 }, item)
    ).toBe(true)
    expect(
      isOrderItemInReportScope({ type: "subdivision", organizationId: 5, subdivisionId: 99 }, item)
    ).toBe(false)
  })

  it("checks organization scope", () => {
    expect(isOrganizationInReportScope({ type: "organization", organizationId: 5 }, 5)).toBe(true)
    expect(isOrganizationInReportScope({ type: "organization", organizationId: 5 }, 9)).toBe(false)
  })
})
