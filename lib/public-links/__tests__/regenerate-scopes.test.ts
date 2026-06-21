import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/access-links", () => ({
  createOrganizationAccessLink: vi.fn(async (organizationId: number) => ({
    id: 1,
    token: `org-${organizationId}`,
    organizationId,
    subdivisionId: null,
  })),
  createSubdivisionAccessLink: vi.fn(async (subdivisionId: number) => ({
    id: 2,
    token: `sub-${subdivisionId}`,
    subdivisionId,
  })),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    subdivision: {
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: number } }) => ({
        id: where.id,
        organizationId: 7,
      })),
    },
  },
}))

vi.mock("@/lib/report-links", () => ({
  createReportLink: vi.fn(async (scope?: { type: string; organizationId?: number; subdivisionId?: number }) => {
    if (scope?.type === "organization") {
      return { id: 10, token: `report-org-${scope.organizationId}` }
    }
    if (scope?.type === "subdivision") {
      return { id: 11, token: `report-sub-${scope.subdivisionId}` }
    }
    return { id: 3, token: "report-new" }
  }),
}))

import { createOrganizationAccessLink, createSubdivisionAccessLink } from "@/lib/access-links"
import { createReportLink } from "@/lib/report-links"
import { regeneratePublicLinkScopes } from "@/lib/public-links/regenerate-scopes"

describe("regeneratePublicLinkScopes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("regenerates report, org, and subdivision keys with scoped report links", async () => {
    const results = await regeneratePublicLinkScopes(["report", "org:7", "sub:49"])

    expect(createReportLink).toHaveBeenCalledWith({ type: "global" })
    expect(createOrganizationAccessLink).toHaveBeenCalledWith(7)
    expect(createReportLink).toHaveBeenCalledWith({ type: "organization", organizationId: 7 })
    expect(createSubdivisionAccessLink).toHaveBeenCalledWith(49)
    expect(createReportLink).toHaveBeenCalledWith({
      type: "subdivision",
      organizationId: 7,
      subdivisionId: 49,
    })

    expect(results).toEqual([
      { key: "report", token: "report-new", path: "/report/report-new" },
      { key: "org:7", token: "org-7", path: "/p/org-7" },
      { key: "sub:49", token: "sub-49", path: "/p/sub-49" },
    ])
  })

  it("deduplicates keys", async () => {
    await regeneratePublicLinkScopes(["org:7", "org:7"])
    expect(createOrganizationAccessLink).toHaveBeenCalledOnce()
    expect(createReportLink).toHaveBeenCalledOnce()
  })
})
