import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const getCachedWorkflowStatuses = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/cache/workflow-statuses", () => ({ getCachedWorkflowStatuses }))

import {
  getCompletedStatusId,
  getDefaultStatusId,
  getInProgressStatusId,
  getWorkflowStatuses,
  listSelectableStatuses,
} from "@/lib/statuses/index"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

describe("statuses index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getDefaultStatusId resolves not-started status", async () => {
    mockPrisma.status.findFirst.mockResolvedValue({ id: 1, name: WORKFLOW_STATUS.NOT_STARTED })
    await expect(getDefaultStatusId()).resolves.toBe(1)
    expect(mockPrisma.status.findFirst).toHaveBeenCalledWith({
      where: { name: WORKFLOW_STATUS.NOT_STARTED },
    })
  })

  it("getInProgressStatusId resolves in-progress status", async () => {
    mockPrisma.status.findFirst.mockResolvedValue({ id: 2, name: WORKFLOW_STATUS.IN_PROGRESS })
    await expect(getInProgressStatusId()).resolves.toBe(2)
  })

  it("getCompletedStatusId resolves completed status", async () => {
    mockPrisma.status.findFirst.mockResolvedValue({ id: 3, name: WORKFLOW_STATUS.COMPLETED })
    await expect(getCompletedStatusId()).resolves.toBe(3)
  })

  it("throws when status not found", async () => {
    mockPrisma.status.findFirst.mockResolvedValue(null)
    await expect(getDefaultStatusId()).rejects.toThrow(
      `Status not found: ${WORKFLOW_STATUS.NOT_STARTED}`
    )
  })

  it("getWorkflowStatuses delegates to cache", async () => {
    const statuses = [{ id: 1, name: WORKFLOW_STATUS.NOT_STARTED }]
    getCachedWorkflowStatuses.mockResolvedValue(statuses)
    await expect(getWorkflowStatuses()).resolves.toEqual(statuses)
  })

  it("listSelectableStatuses delegates to cache", async () => {
    const statuses = [{ id: 2, name: WORKFLOW_STATUS.IN_PROGRESS }]
    getCachedWorkflowStatuses.mockResolvedValue(statuses)
    await expect(listSelectableStatuses()).resolves.toEqual(statuses)
  })
})
