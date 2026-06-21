import { ResponseReviewStatus } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))

import {
  countPendingResponses,
  getResponse,
  listResponses,
  RESPONSE_REVIEW_STATUS_LABELS,
} from "@/lib/responses/index"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

describe("responses index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports review status labels", () => {
    expect(RESPONSE_REVIEW_STATUS_LABELS.PENDING).toBe("На проверке")
    expect(RESPONSE_REVIEW_STATUS_LABELS.ACCEPTED).toBe("Принят")
    expect(RESPONSE_REVIEW_STATUS_LABELS.REJECTED).toBe("Не принят")
  })

  it("getResponse loads by id", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({ id: 5 })
    const result = await getResponse(5)
    expect(result).toEqual({ id: 5 })
    expect(mockPrisma.response.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    )
  })

  it("countPendingResponses counts pending", async () => {
    mockPrisma.response.count.mockResolvedValue(7)
    await expect(countPendingResponses()).resolves.toBe(7)
    expect(mockPrisma.response.count).toHaveBeenCalledWith({
      where: { reviewStatus: ResponseReviewStatus.PENDING },
    })
  })

  it("listResponses without filter", async () => {
    mockPrisma.response.findMany.mockResolvedValue([{ id: 1 }])
    const result = await listResponses()
    expect(result).toHaveLength(1)
    expect(mockPrisma.response.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it("listResponses with status filter", async () => {
    mockPrisma.response.findMany.mockResolvedValue([])
    await listResponses(ResponseReviewStatus.ACCEPTED)
    expect(mockPrisma.response.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reviewStatus: ResponseReviewStatus.ACCEPTED },
      })
    )
  })
})
