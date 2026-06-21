import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/attachments", () => ({
  getAttachmentReadUrl: vi.fn(),
}))

import { getAttachmentReadUrl } from "@/lib/attachments"
import { createAttachmentRedirectHandler } from "@/lib/api/attachment-redirect"

describe("createAttachmentRedirectHandler", () => {
  it("returns 404 when attachment not resolved", async () => {
    const handler = createAttachmentRedirectHandler(async () => null)
    const res = await handler(new Request("http://localhost/api/attachments/1"), 1)
    expect(res.status).toBe(404)
  })

  it("returns 404 when read url missing", async () => {
    vi.mocked(getAttachmentReadUrl).mockResolvedValue(null)
    const handler = createAttachmentRedirectHandler(async () => ({ id: 1 }))
    const res = await handler(new Request("http://localhost/api/attachments/1"), 1)
    expect(res.status).toBe(404)
  })

  it("redirects to presigned url", async () => {
    vi.mocked(getAttachmentReadUrl).mockResolvedValue("https://signed/read")
    const handler = createAttachmentRedirectHandler(async () => ({ id: 1 }))
    const res = await handler(
      new Request("http://localhost/api/attachments/1?download=1"),
      1
    )
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("https://signed/read")
    expect(getAttachmentReadUrl).toHaveBeenCalledWith(1, { download: true })
  })
})
