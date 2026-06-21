import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma
vi.mock("@/lib/storage/s3", () => ({
  createPutPresignedUrl: vi.fn().mockResolvedValue("https://upload-url"),
  createGetPresignedUrl: vi.fn().mockResolvedValue("https://read-url"),
}))
vi.mock("@/lib/public/validate-token", () => ({
  validateAccessLink: vi.fn(),
}))
vi.mock("@/lib/report-links/validate-token", () => ({
  validateReportToken: vi.fn(),
}))

import { validateAccessLink } from "@/lib/public/validate-token"
import { validateReportToken } from "@/lib/report-links/validate-token"
import { createGetPresignedUrl, createPutPresignedUrl } from "@/lib/storage/s3"
import {
  assertOrderItemExists,
  createPendingAttachment,
  getAttachmentForPanel,
  getAttachmentForPublicToken,
  getAttachmentForReportToken,
  getAttachmentReadUrl,
  linkAttachmentsToResponse,
} from "@/lib/attachments"
describe("createPendingAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createPutPresignedUrl).mockResolvedValue("https://upload-url")
    mockPrisma.responseAttachment.count.mockResolvedValue(0)
    mockPrisma.responseAttachment.create.mockResolvedValue({
      id: 10,
      storageKey: "attachments/1/uuid.png",
      originalName: "photo.png",
    })
  })

  it("rejects invalid mime type", async () => {
    await expect(
      createPendingAttachment(1, {
        originalName: "doc.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
      })
    ).rejects.toThrow("INVALID_MIME_TYPE")
  })

  it("rejects invalid file size", async () => {
    await expect(
      createPendingAttachment(1, {
        originalName: "big.png",
        mimeType: "image/png",
        sizeBytes: 6 * 1024 * 1024,
      })
    ).rejects.toThrow("INVALID_FILE_SIZE")
  })

  it("rejects zero-byte file size", async () => {
    await expect(
      createPendingAttachment(1, {
        originalName: "empty.png",
        mimeType: "image/png",
        sizeBytes: 0,
      })
    ).rejects.toThrow("INVALID_FILE_SIZE")
  })

  it("rejects too many pending attachments", async () => {
    mockPrisma.responseAttachment.count.mockResolvedValue(10)
    await expect(
      createPendingAttachment(1, {
        originalName: "photo.png",
        mimeType: "image/png",
        sizeBytes: 100,
      })
    ).rejects.toThrow("TOO_MANY_ATTACHMENTS")
  })

  it("creates attachment and presigned upload url", async () => {
    const result = await createPendingAttachment(1, {
      originalName: "photo.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    })
    expect(result.uploadUrl).toBe("https://upload-url")
    expect(result.attachment.id).toBe(10)
    expect(createPutPresignedUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^attachments\/1\/.+\.png$/),
      "image/png",
      1024
    )
  })
})

describe("linkAttachmentsToResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("no-ops for empty ids", async () => {
    await linkAttachmentsToResponse(1, 2, [])
    expect(mockPrisma.responseAttachment.findMany).not.toHaveBeenCalled()
  })

  it("throws when too many attachment ids provided", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1)
    await expect(linkAttachmentsToResponse(1, 2, ids)).rejects.toThrow(
      "TOO_MANY_ATTACHMENTS"
    )
  })

  it("throws when attachments not found", async () => {
    mockPrisma.responseAttachment.findMany.mockResolvedValue([{ id: 1 }])
    await expect(linkAttachmentsToResponse(1, 2, [1, 2])).rejects.toThrow(
      "INVALID_ATTACHMENTS"
    )
  })

  it("links valid attachments", async () => {
    mockPrisma.responseAttachment.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    await linkAttachmentsToResponse(5, 2, [1, 2])
    expect(mockPrisma.responseAttachment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      data: { responseId: 5 },
    })
  })

  it("deduplicates attachment ids before linking", async () => {
    mockPrisma.responseAttachment.findMany.mockResolvedValue([{ id: 1 }])
    await linkAttachmentsToResponse(5, 2, [1, 1])
    expect(mockPrisma.responseAttachment.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: [1] },
        orderItemId: 2,
        responseId: null,
      },
    })
  })
})

describe("getAttachmentReadUrl", () => {
  beforeEach(() => {
    vi.mocked(createGetPresignedUrl).mockResolvedValue("https://read-url")
  })

  it("returns null when attachment missing", async () => {
    mockPrisma.responseAttachment.findUnique.mockResolvedValue(null)
    expect(await getAttachmentReadUrl(99)).toBeNull()
  })

  it("returns presigned url", async () => {
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({
      id: 1,
      storageKey: "attachments/1/uuid.png",
      originalName: "photo.png",
    })
    const url = await getAttachmentReadUrl(1, { download: true })
    expect(url).toBe("https://read-url")
    expect(createGetPresignedUrl).toHaveBeenCalledWith("attachments/1/uuid.png", {
      downloadFilename: "photo.png",
    })
  })

  it("returns presigned url without download option", async () => {
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({
      id: 1,
      storageKey: "attachments/1/uuid.png",
      originalName: "photo.png",
    })
    await getAttachmentReadUrl(1)
    expect(createGetPresignedUrl).toHaveBeenCalledWith("attachments/1/uuid.png", undefined)
  })
})

describe("getAttachmentForPublicToken", () => {
  it("returns null when token invalid", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue(null)
    expect(await getAttachmentForPublicToken("bad", 1)).toBeNull()
  })

  it("returns null when org mismatch", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue({
      link: { organizationId: 10, subdivisionId: null },
    } as never)
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({
      id: 1,
      orderItem: { subdivisionId: null, order: { organizationId: 99 } },
    })
    expect(await getAttachmentForPublicToken("token", 1)).toBeNull()
  })

  it("returns attachment when link has no subdivision scope", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue({
      link: { organizationId: 10, subdivisionId: null },
    } as never)
    const attachment = {
      id: 1,
      orderItem: { subdivisionId: 5, order: { organizationId: 10 } },
    }
    mockPrisma.responseAttachment.findUnique.mockResolvedValue(attachment)
    expect(await getAttachmentForPublicToken("token", 1)).toEqual(attachment)
  })

  it("returns attachment when scoped correctly", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue({
      link: { organizationId: 10, subdivisionId: 5 },
    } as never)
    const attachment = {
      id: 1,
      orderItem: { subdivisionId: 5, order: { organizationId: 10 } },
    }
    mockPrisma.responseAttachment.findUnique.mockResolvedValue(attachment)
    expect(await getAttachmentForPublicToken("token", 1)).toEqual(attachment)
  })

  it("returns null when subdivision does not match scoped link", async () => {
    vi.mocked(validateAccessLink).mockResolvedValue({
      link: { organizationId: 10, subdivisionId: 5 },
    } as never)
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({
      id: 1,
      orderItem: { subdivisionId: 99, order: { organizationId: 10 } },
    })
    expect(await getAttachmentForPublicToken("token", 1)).toBeNull()
  })
})

describe("getAttachmentForReportToken", () => {
  it("returns null when report token invalid", async () => {
    vi.mocked(validateReportToken).mockResolvedValue(null)
    expect(await getAttachmentForReportToken("bad", 1)).toBeNull()
  })

  it("returns attachment with responseId", async () => {
    vi.mocked(validateReportToken).mockResolvedValue({} as never)
    const attachment = { id: 1, responseId: 5 }
    mockPrisma.responseAttachment.findUnique.mockResolvedValue(attachment)
    expect(await getAttachmentForReportToken("token", 1)).toEqual(attachment)
  })

  it("returns null when attachment has no responseId", async () => {
    vi.mocked(validateReportToken).mockResolvedValue({} as never)
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({ id: 1, responseId: null })
    expect(await getAttachmentForReportToken("token", 1)).toBeNull()
  })
})

describe("getAttachmentForPanel", () => {
  it("delegates to prisma", async () => {
    mockPrisma.responseAttachment.findUnique.mockResolvedValue({ id: 1 })
    expect(await getAttachmentForPanel(1)).toEqual({ id: 1 })
  })
})

describe("assertOrderItemExists", () => {
  it("throws NOT_FOUND when missing", async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValue(null)
    await expect(assertOrderItemExists(1, 2)).rejects.toThrow("NOT_FOUND")
  })

  it("returns item when found", async () => {
    const item = { id: 2, status: { name: "In progress" } }
    mockPrisma.orderItem.findFirst.mockResolvedValue(item)
    expect(await assertOrderItemExists(1, 2)).toEqual(item)
  })
})
