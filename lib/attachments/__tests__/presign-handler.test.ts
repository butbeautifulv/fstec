import { beforeEach, describe, expect, it, vi } from "vitest"

const mockCreatePendingAttachment = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    attachment: { id: 7, storageKey: "attachments/1/uuid.png" },
    uploadUrl: "https://upload-url",
  })
)

vi.mock("@/lib/attachments", () => ({
  createPendingAttachment: mockCreatePendingAttachment,
}))

import { handleAttachmentPresign } from "@/lib/attachments/presign-handler"

describe("handleAttachmentPresign", () => {
  beforeEach(() => {
    mockCreatePendingAttachment.mockResolvedValue({
      attachment: { id: 7, storageKey: "attachments/1/uuid.png" },
      uploadUrl: "https://upload-url",
    })
  })

  it("returns validation error for invalid body", async () => {
    const res = await handleAttachmentPresign(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ originalName: "", mimeType: "image/png", sizeBytes: 0 }),
      }),
      1
    )
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(mockCreatePendingAttachment).not.toHaveBeenCalled()
  })

  it("creates pending attachment and returns presign payload", async () => {
    const res = await handleAttachmentPresign(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          originalName: "photo.png",
          mimeType: "image/png",
          sizeBytes: 1024,
        }),
      }),
      3
    )
    expect(mockCreatePendingAttachment).toHaveBeenCalledWith(3, {
      originalName: "photo.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      attachmentId: 7,
      uploadUrl: "https://upload-url",
      storageKey: "attachments/1/uuid.png",
    })
  })
})
