import { ResponseReviewStatus } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const getCompletedStatusId = vi.hoisted(() => vi.fn())
const getInProgressStatusId = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/statuses", () => ({
  getCompletedStatusId,
  getInProgressStatusId,
}))

import { reviewResponse } from "@/lib/responses/review-response"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

const pendingResponse = {
  id: 1,
  reviewStatus: ResponseReviewStatus.PENDING,
  orderItemId: 10,
  orderItem: { status: { name: "В работе" } },
}

describe("reviewResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.response.findUnique.mockResolvedValue(pendingResponse)
    getCompletedStatusId.mockResolvedValue(3)
    getInProgressStatusId.mockResolvedValue(2)
    mockPrisma.response.update.mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      ...(args.data as object),
      attachments: [],
      orderItem: pendingResponse.orderItem,
    }))
  })

  it("throws NOT_FOUND when response missing", async () => {
    mockPrisma.response.findUnique.mockResolvedValue(null)
    await expect(reviewResponse(1, "accept", 5)).rejects.toThrow("NOT_FOUND")
  })

  it("throws INVALID_STATUS when not pending", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({
      ...pendingResponse,
      reviewStatus: ResponseReviewStatus.ACCEPTED,
    })
    await expect(reviewResponse(1, "accept", 5)).rejects.toThrow("INVALID_STATUS")
  })

  it("throws REVIEW_NOTE_REQUIRED on reject without note", async () => {
    await expect(reviewResponse(1, "reject", 5)).rejects.toThrow("REVIEW_NOTE_REQUIRED")
    await expect(reviewResponse(1, "reject", 5, "   ")).rejects.toThrow(
      "REVIEW_NOTE_REQUIRED"
    )
  })

  it("accepts response and sets completed status", async () => {
    const result = await reviewResponse(1, "accept", 5)

    expect(result.reviewStatus).toBe(ResponseReviewStatus.ACCEPTED)
    expect(getCompletedStatusId).toHaveBeenCalled()
    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { statusId: 3 },
    })
  })

  it("rejects response and sets in-progress status", async () => {
    const result = await reviewResponse(1, "reject", 5, "Needs revision")

    expect(result.reviewStatus).toBe(ResponseReviewStatus.REJECTED)
    expect(getInProgressStatusId).toHaveBeenCalled()
    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { statusId: 2 },
    })
    expect(mockPrisma.response.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewNote: "Needs revision",
        }),
      })
    )
  })
})
