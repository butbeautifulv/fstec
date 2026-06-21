import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetCachedJson = vi.hoisted(() => vi.fn())

vi.mock("@/lib/cache/json-cache", () => ({
  getCachedJson: mockGetCachedJson,
}))

vi.mock("@/lib/cache/redis", () => ({
  getDashboardCacheTtl: vi.fn(() => 300),
  getReferenceCacheTtl: vi.fn(() => 900),
}))

vi.mock("@/lib/measures", () => ({
  listMeasures: vi.fn().mockResolvedValue([{ id: 1 }]),
}))

vi.mock("@/lib/orders", () => ({
  listOrders: vi.fn().mockResolvedValue([{ id: 2 }]),
}))

vi.mock("@/lib/delays", () => ({
  countPendingDelayRequests: vi.fn().mockResolvedValue(3),
}))

vi.mock("@/lib/responses", () => ({
  countPendingResponses: vi.fn().mockResolvedValue(7),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    status: {
      findMany: vi.fn().mockResolvedValue([{ id: 1, name: "Not started" }]),
    },
  },
}))

import { getDashboardCacheTtl, getReferenceCacheTtl } from "@/lib/cache/redis"
import { getCachedListMeasures } from "@/lib/cache/list-measures"
import { getCachedListOrders } from "@/lib/cache/list-orders"
import {
  getCachedPendingDelayCount,
  getCachedPendingResponseCount,
} from "@/lib/cache/panel-counts"
import { getCachedWorkflowStatuses } from "@/lib/cache/workflow-statuses"
import { listMeasures } from "@/lib/measures"
import { listOrders } from "@/lib/orders"
import { countPendingDelayRequests } from "@/lib/delays"
import { countPendingResponses } from "@/lib/responses"
import { prisma } from "@/lib/db"

describe("cache modules", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedJson.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    )
  })

  it("getCachedListMeasures uses list:measures key", async () => {
    await getCachedListMeasures()
    expect(mockGetCachedJson).toHaveBeenCalledWith(
      "list:measures",
      300,
      listMeasures
    )
    expect(getDashboardCacheTtl).toHaveBeenCalled()
  })

  it("getCachedListOrders uses list:orders key", async () => {
    await getCachedListOrders()
    expect(mockGetCachedJson).toHaveBeenCalledWith("list:orders", 300, listOrders)
  })

  it("getCachedPendingDelayCount uses panel:pending:delays key", async () => {
    await getCachedPendingDelayCount()
    expect(mockGetCachedJson).toHaveBeenCalledWith(
      "panel:pending:delays",
      300,
      countPendingDelayRequests
    )
  })

  it("getCachedPendingResponseCount uses panel:pending:responses key", async () => {
    await getCachedPendingResponseCount()
    expect(mockGetCachedJson).toHaveBeenCalledWith(
      "panel:pending:responses",
      300,
      countPendingResponses
    )
  })

  it("getCachedWorkflowStatuses uses ref:workflow-statuses key", async () => {
    await getCachedWorkflowStatuses()
    expect(mockGetCachedJson).toHaveBeenCalledWith(
      "ref:workflow-statuses",
      900,
      expect.any(Function)
    )
    expect(getReferenceCacheTtl).toHaveBeenCalled()
    expect(prisma.status.findMany).toHaveBeenCalled()
  })
})
