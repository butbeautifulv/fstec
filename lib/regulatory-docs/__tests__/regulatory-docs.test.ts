import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetObjectBuffer = vi.hoisted(() =>
  vi.fn().mockResolvedValue(Buffer.from("file"))
)
const mockPutObjectBuffer = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockCreateGetPresignedUrl = vi.hoisted(() =>
  vi.fn().mockResolvedValue("https://download-url")
)

vi.mock("@/lib/storage/s3", () => ({
  putObjectBuffer: mockPutObjectBuffer,
  getObjectBuffer: mockGetObjectBuffer,
  createGetPresignedUrl: mockCreateGetPresignedUrl,
}))

import {
  isAllowedRegulatoryDocMimeType,
  isDocxFilename,
  MAX_REGULATORY_DOC_SIZE_BYTES,
  regulatoryDocStorageKey,
} from "@/lib/regulatory-docs/config"
import {
  downloadRegulatoryDocBuffer,
  getRegulatoryDocDownloadUrl,
  uploadRegulatoryDocBuffer,
} from "@/lib/regulatory-docs/storage"

describe("regulatory-docs config", () => {
  it("isAllowedRegulatoryDocMimeType accepts docx mime", () => {
    expect(
      isAllowedRegulatoryDocMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true)
    expect(isAllowedRegulatoryDocMimeType("text/plain")).toBe(false)
  })

  it("isDocxFilename checks extension", () => {
    expect(isDocxFilename("file.DOCX")).toBe(true)
    expect(isDocxFilename("file.pdf")).toBe(false)
  })

  it("regulatoryDocStorageKey sanitizes name", () => {
    expect(regulatoryDocStorageKey(5, "Приложение 240.docx")).toMatch(
      /^regulatory-docs\/5\//
    )
  })

  it("exports max size", () => {
    expect(MAX_REGULATORY_DOC_SIZE_BYTES).toBe(20 * 1024 * 1024)
  })
})

describe("regulatory-docs storage", () => {
  beforeEach(() => {
    mockGetObjectBuffer.mockResolvedValue(Buffer.from("file"))
    mockCreateGetPresignedUrl.mockResolvedValue("https://download-url")
    mockPutObjectBuffer.mockResolvedValue(undefined)
  })

  it("uploadRegulatoryDocBuffer stores and returns sha256", async () => {
    const buffer = Buffer.from("docx-data")
    const result = await uploadRegulatoryDocBuffer("key/doc.docx", buffer, "application/octet-stream")
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(mockPutObjectBuffer).toHaveBeenCalledWith(
      "key/doc.docx",
      buffer,
      "application/octet-stream"
    )
  })

  it("downloadRegulatoryDocBuffer delegates to s3", async () => {
    const buf = await downloadRegulatoryDocBuffer("key/doc.docx")
    expect(buf).toEqual(Buffer.from("file"))
    expect(mockGetObjectBuffer).toHaveBeenCalledWith("key/doc.docx")
  })

  it("getRegulatoryDocDownloadUrl returns presigned url", async () => {
    const url = await getRegulatoryDocDownloadUrl("key/doc.docx", "doc.docx")
    expect(url).toBe("https://download-url")
    expect(mockCreateGetPresignedUrl).toHaveBeenCalledWith("key/doc.docx", {
      downloadFilename: "doc.docx",
    })
  })
})
