import { beforeEach, describe, expect, it, vi } from "vitest"
import { ResponseReviewStatus } from "@prisma/client"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react")
  return { ...actual, cache: <T>(fn: T) => fn }
})

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
  get prismaRead() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrismaRead = mocks.prisma

vi.mock("@/lib/cache/json-cache", () => ({
  getCachedJson: vi.fn(async (_key, _ttl, fetcher: () => Promise<unknown>) => fetcher()),
}))

vi.mock("@/lib/public/validate-token", async () => {
  const actual = await vi.importActual<typeof import("@/lib/public/validate-token")>(
    "@/lib/public/validate-token"
  )
  return {
    ...actual,
    validateAccessLink: vi.fn(),
  }
})

import { validateAccessLink } from "@/lib/public/validate-token"
import {
  countPublicReportItems,
  countPublicReportsNeedingRevision,
  fetchPublicReportItems,
} from "@/lib/public/reports"

const ctx = {
  link: { organizationId: 10, subdivisionId: null },
  organization: { id: 10, name: "Org" },
  subdivision: null,
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: { id: 1, name: "In progress", isTerminal: false },
    measure: { id: 1, name: "Measure", code: "M-1" },
    order: { id: 1, title: "Order" },
    responses: [
      {
        reviewStatus: ResponseReviewStatus.PENDING,
        reviewNote: null,
        submittedAt: new Date("2026-06-01"),
      },
    ],
    ...overrides,
  }
}

describe("fetchPublicReportItems", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAccessLink).mockResolvedValue(ctx as never)
  })

  it("returns null when token invalid", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue(null)
    expect(await fetchPublicReportItems("bad")).toBeNull()
  })

  it("maps report rows", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([makeItem()])
    const result = await fetchPublicReportItems("token")
    expect(result?.rows).toHaveLength(1)
    expect(result?.rows[0]).toMatchObject({
      orderItemId: 1,
      reviewStatus: ResponseReviewStatus.PENDING,
      needsRevision: false,
    })
  })

  it("filters pending reports", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      makeItem(),
      makeItem({
        id: 2,
        responses: [
          {
            reviewStatus: ResponseReviewStatus.ACCEPTED,
            reviewNote: null,
            submittedAt: new Date("2026-06-02"),
          },
        ],
      }),
    ])
    const result = await fetchPublicReportItems("token", ResponseReviewStatus.PENDING)
    expect(result?.rows).toHaveLength(1)
    expect(result?.rows[0].orderItemId).toBe(1)
  })

  it("filters rejected needing revision", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      makeItem({
        responses: [
          {
            reviewStatus: ResponseReviewStatus.REJECTED,
            reviewNote: "Fix",
            submittedAt: new Date("2026-06-01"),
          },
        ],
      }),
    ])
    const result = await fetchPublicReportItems("token", ResponseReviewStatus.REJECTED)
    expect(result?.rows[0].needsRevision).toBe(true)
  })

  it("filters accepted reports including completed items", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      makeItem({
        id: 1,
        responses: [
          {
            reviewStatus: ResponseReviewStatus.ACCEPTED,
            reviewNote: null,
            submittedAt: new Date("2026-06-01"),
          },
        ],
      }),
      makeItem({
        id: 2,
        status: { id: 2, name: "Completed", isTerminal: true },
        responses: [
          {
            reviewStatus: ResponseReviewStatus.REJECTED,
            reviewNote: "Old",
            submittedAt: new Date("2026-06-02"),
          },
        ],
      }),
      makeItem({
        id: 3,
        responses: [
          {
            reviewStatus: ResponseReviewStatus.PENDING,
            reviewNote: null,
            submittedAt: new Date("2026-06-03"),
          },
        ],
      }),
    ])
    const result = await fetchPublicReportItems("token", ResponseReviewStatus.ACCEPTED)
    expect(result?.rows.map((r) => r.orderItemId)).toEqual([1, 2])
  })

  it("excludes completed rejected items from rejected filter", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      makeItem({
        id: 2,
        status: { id: 2, name: "Completed", isTerminal: true },
        responses: [
          {
            reviewStatus: ResponseReviewStatus.REJECTED,
            reviewNote: "Fix",
            submittedAt: new Date("2026-06-01"),
          },
        ],
      }),
    ])
    const result = await fetchPublicReportItems("token", ResponseReviewStatus.REJECTED)
    expect(result?.rows).toHaveLength(0)
  })

  it("returns all rows for unrecognized filter value", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([makeItem(), makeItem({ id: 2 })])
    const result = await fetchPublicReportItems(
      "token",
      "UNKNOWN" as ResponseReviewStatus
    )
    expect(result?.rows).toHaveLength(2)
  })
})

describe("countPublicReportsNeedingRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAccessLink).mockResolvedValue(ctx as never)
  })

  it("counts rejected non-terminal items", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([
      makeItem({
        responses: [
          {
            reviewStatus: ResponseReviewStatus.REJECTED,
            reviewNote: "Fix",
            submittedAt: new Date("2026-06-01"),
          },
        ],
      }),
      makeItem({
        id: 2,
        status: { id: 2, name: "Completed", isTerminal: true },
        responses: [
          {
            reviewStatus: ResponseReviewStatus.REJECTED,
            reviewNote: "Fix",
            submittedAt: new Date("2026-06-01"),
          },
        ],
      }),
    ])
    expect(await countPublicReportsNeedingRevision("token")).toBe(1)
  })
})

describe("countPublicReportItems", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAccessLink).mockResolvedValue(ctx as never)
  })

  it("returns zero for invalid token", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue(null)
    expect(await countPublicReportItems("bad")).toBe(0)
  })

  it("counts filtered items", async () => {
    mockPrismaRead.orderItem.findMany.mockResolvedValue([makeItem(), makeItem({ id: 2 })])
    expect(await countPublicReportItems("token")).toBe(2)
  })
})
