import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/report-links", () => ({
  getActiveReportLink: vi.fn(),
  getActiveReportLinks: vi.fn(),
}))

import { getActiveReportLink, getActiveReportLinks } from "@/lib/report-links"
import {
  getOrganizationReportTokens,
  getReportShareContext,
} from "@/lib/report-links/share-context"

describe("getReportShareContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns active link token and manage flag for settings writer", async () => {
    vi.mocked(getActiveReportLink).mockResolvedValue({
      id: 7,
      token: "report-token",
    } as never)

    const ctx = await getReportShareContext({ role: "SUPER_ADMIN" })

    expect(getActiveReportLink).toHaveBeenCalledWith({ type: "global" })
    expect(ctx).toEqual({
      reportToken: "report-token",
      reportLinkId: 7,
      canManageReportLinks: true,
    })
  })

  it("returns null token when no active link", async () => {
    vi.mocked(getActiveReportLink).mockResolvedValue(null)

    const ctx = await getReportShareContext({ role: "VIEWER" })

    expect(ctx).toEqual({
      reportToken: null,
      reportLinkId: null,
      canManageReportLinks: false,
    })
  })

  it("passes custom dashboard scope to getActiveReportLink", async () => {
    vi.mocked(getActiveReportLink).mockResolvedValue(null)
    const scope = { type: "organization" as const, organizationId: 3 }

    await getReportShareContext({ role: "VIEWER" }, scope)

    expect(getActiveReportLink).toHaveBeenCalledWith(scope)
  })
})

describe("getOrganizationReportTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps organization and subdivision report tokens", async () => {
    vi.mocked(getActiveReportLinks).mockResolvedValue([
      {
        organizationId: 5,
        subdivisionId: null,
        token: "org-token",
      },
      {
        organizationId: 5,
        subdivisionId: 10,
        token: "sub-10",
      },
      {
        organizationId: 99,
        subdivisionId: null,
        token: "other-org",
      },
    ] as never)

    const result = await getOrganizationReportTokens(5, [10, 11])

    expect(result).toEqual({
      orgReportToken: "org-token",
      subReportTokens: { 10: "sub-10" },
    })
  })

  it("returns null org token when organization link is missing", async () => {
    vi.mocked(getActiveReportLinks).mockResolvedValue([
      {
        organizationId: 5,
        subdivisionId: 10,
        token: "sub-only",
      },
    ] as never)

    const result = await getOrganizationReportTokens(5, [10])

    expect(result).toEqual({
      orgReportToken: null,
      subReportTokens: { 10: "sub-only" },
    })
  })
})
