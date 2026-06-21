import { beforeEach, describe, expect, it, vi } from "vitest"
import { DelayRequestStatus } from "@prisma/client"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  countPendingDelayRequests,
  DELAY_STATUS_LABELS,
  getDelayRequest,
  listDelayRequests,
} from "@/lib/delays"

describe("delays index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("countPendingDelayRequests counts PENDING status", async () => {
    mockPrisma.delayRequest.count.mockResolvedValue(3)
    const count = await countPendingDelayRequests()
    expect(count).toBe(3)
    expect(mockPrisma.delayRequest.count).toHaveBeenCalledWith({
      where: { status: DelayRequestStatus.PENDING },
    })
  })

  it("listDelayRequests loads all when status omitted", async () => {
    mockPrisma.delayRequest.findMany.mockResolvedValue([{ id: 1 }])
    const result = await listDelayRequests()
    expect(result).toEqual([{ id: 1 }])
    expect(mockPrisma.delayRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined, orderBy: { createdAt: "desc" } })
    )
  })

  it("listDelayRequests filters by status", async () => {
    mockPrisma.delayRequest.findMany.mockResolvedValue([])
    await listDelayRequests(DelayRequestStatus.APPROVED)
    expect(mockPrisma.delayRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: DelayRequestStatus.APPROVED } })
    )
  })

  it("getDelayRequest loads request with relations", async () => {
    mockPrisma.delayRequest.findUnique.mockResolvedValue({ id: 7 })
    const result = await getDelayRequest(7)
    expect(result).toEqual({ id: 7 })
    expect(mockPrisma.delayRequest.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } })
    )
  })

  it("DELAY_STATUS_LABELS maps all statuses", () => {
    expect(DELAY_STATUS_LABELS.PENDING).toBe("Ожидает")
    expect(DELAY_STATUS_LABELS.APPROVED).toBe("Одобрен")
    expect(DELAY_STATUS_LABELS.REJECTED).toBe("Отклонён")
  })
})
