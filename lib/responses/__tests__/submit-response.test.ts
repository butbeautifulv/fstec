import { ResponseReviewStatus } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const linkAttachmentsToResponse = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/attachments", () => ({ linkAttachmentsToResponse }))

import { submitOrderItemResponse } from "@/lib/responses/submit-response"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

const inProgressItem = {
  id: 10,
  status: { name: WORKFLOW_STATUS.IN_PROGRESS, isTerminal: false },
}

describe("submitOrderItemResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.orderItem.findUnique.mockResolvedValue(inProgressItem)
    mockPrisma.response.findFirst.mockResolvedValue(null)
    mockPrisma.response.create.mockImplementation(async (args: { data: unknown }) => ({
      id: 100,
      attachments: [],
      ...(args.data as object),
    }))
    mockPrisma.orderItem.findUniqueOrThrow.mockResolvedValue({
      ...inProgressItem,
      measure: { id: 1, name: "Measure" },
    })
    mockPrisma.response.findUniqueOrThrow.mockResolvedValue({
      id: 100,
      attachments: [],
      reviewStatus: ResponseReviewStatus.PENDING,
    })
  })

  it("throws NOT_FOUND when order item missing", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValue(null)
    await expect(
      submitOrderItemResponse(10, { result: "Done" })
    ).rejects.toThrow("NOT_FOUND")
  })

  it("throws INVALID_STATUS when not in progress", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValue({
      id: 10,
      status: { name: "Архив", isTerminal: false },
    })
    await expect(
      submitOrderItemResponse(10, { result: "Done" })
    ).rejects.toThrow("INVALID_STATUS")
  })

  it("throws INVALID_STATUS when terminal", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValue({
      id: 10,
      status: { name: WORKFLOW_STATUS.COMPLETED, isTerminal: true },
    })
    await expect(
      submitOrderItemResponse(10, { result: "Done" })
    ).rejects.toThrow("INVALID_STATUS")
  })

  it("throws PENDING_EXISTS when pending response exists", async () => {
    mockPrisma.response.findFirst.mockResolvedValue({ id: 5 })
    await expect(
      submitOrderItemResponse(10, { result: "Done" })
    ).rejects.toThrow("PENDING_EXISTS")
  })

  it("creates response without attachments", async () => {
    const result = await submitOrderItemResponse(10, {
      result: "Completed work",
      commentary: "Note",
    })

    expect(result.response.id).toBe(100)
    expect(result.item.id).toBe(10)
    expect(linkAttachmentsToResponse).not.toHaveBeenCalled()
    expect(mockPrisma.response.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderItemId: 10,
          result: "Completed work",
          reviewStatus: ResponseReviewStatus.PENDING,
        }),
      })
    )
  })

  it("updates subdivision and links attachments", async () => {
    await submitOrderItemResponse(10, {
      result: "Done",
      subdivisionId: 3,
      attachmentIds: [1, 2],
    })

    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { subdivisionId: 3 },
    })
    expect(linkAttachmentsToResponse).toHaveBeenCalledWith(100, 10, [1, 2], mockPrisma)
  })
})
