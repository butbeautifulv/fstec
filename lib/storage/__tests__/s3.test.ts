import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSend = vi.hoisted(() => vi.fn())
const mockGetSignedUrl = vi.hoisted(() => vi.fn().mockResolvedValue("https://signed-url"))

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: mockSend })),
  HeadBucketCommand: vi.fn((input) => ({ ...input, _type: "HeadBucket" })),
  CreateBucketCommand: vi.fn((input) => ({ ...input, _type: "CreateBucket" })),
  PutBucketCorsCommand: vi.fn((input) => ({ ...input, _type: "PutBucketCors" })),
  PutObjectCommand: vi.fn((input) => ({ ...input, _type: "PutObject" })),
  GetObjectCommand: vi.fn((input) => ({ ...input, _type: "GetObject" })),
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}))

vi.mock("@/lib/storage/config", () => ({
  getS3Config: vi.fn(() => ({
    endpoint: "http://minio:9000",
    region: "us-east-1",
    accessKey: "key",
    secretKey: "secret",
    bucket: "test-bucket",
    forcePathStyle: true,
  })),
  PRESIGNED_URL_EXPIRY_SECONDS: 900,
}))

describe("s3 storage", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    mockSend.mockReset()
    mockGetSignedUrl.mockResolvedValue("https://signed-url")
  })

  it("ensureBucket uses existing bucket when head succeeds", async () => {
    mockSend.mockResolvedValue({})
    const { ensureBucket } = await import("@/lib/storage/s3")
    await ensureBucket()
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend.mock.calls[0][0]._type).toBe("HeadBucket")
  })

  it("ensureBucket creates bucket when head fails", async () => {
    mockSend
      .mockRejectedValueOnce(new Error("NoSuchBucket"))
      .mockResolvedValueOnce({})
    const { ensureBucket } = await import("@/lib/storage/s3")
    await ensureBucket()
    expect(mockSend).toHaveBeenCalledTimes(2)
    expect(mockSend.mock.calls[1][0]._type).toBe("CreateBucket")
  })

  it("putObjectBuffer uploads buffer", async () => {
    mockSend.mockResolvedValue({})
    const { putObjectBuffer } = await import("@/lib/storage/s3")
    await putObjectBuffer("key/file.png", Buffer.from("data"), "image/png")
    const putCall = mockSend.mock.calls.find((c) => c[0]._type === "PutObject")
    expect(putCall?.[0]).toMatchObject({
      Bucket: "test-bucket",
      Key: "key/file.png",
      ContentType: "image/png",
    })
  })

  it("getObjectBuffer returns buffer from body", async () => {
    mockSend.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    })
    const { getObjectBuffer } = await import("@/lib/storage/s3")
    const buf = await getObjectBuffer("key/file.png")
    expect(buf).toEqual(Buffer.from([1, 2, 3]))
  })

  it("getObjectBuffer throws when body missing", async () => {
    mockSend.mockResolvedValue({ Body: null })
    const { getObjectBuffer } = await import("@/lib/storage/s3")
    await expect(getObjectBuffer("missing")).rejects.toThrow("NOT_FOUND")
  })

  it("createPutPresignedUrl returns signed url", async () => {
    mockSend.mockResolvedValue({})
    const { createPutPresignedUrl } = await import("@/lib/storage/s3")
    const url = await createPutPresignedUrl("attachments/1/uuid.png", "image/png", 1024)
    expect(url).toBe("https://signed-url")
    expect(mockGetSignedUrl).toHaveBeenCalled()
  })

  it("createGetPresignedUrl passes download filename", async () => {
    mockSend.mockResolvedValue({})
    const { createGetPresignedUrl } = await import("@/lib/storage/s3")
    await createGetPresignedUrl("attachments/1/uuid.png", {
      downloadFilename: "photo.png",
    })
    expect(mockGetSignedUrl).toHaveBeenCalled()
  })

  it("createGetPresignedUrl works without download filename", async () => {
    mockSend.mockResolvedValue({})
    const { createGetPresignedUrl } = await import("@/lib/storage/s3")
    const url = await createGetPresignedUrl("attachments/1/uuid.png")
    expect(url).toBe("https://signed-url")
    expect(mockGetSignedUrl).toHaveBeenCalled()
  })

  it("ensureStorageReady logs warning when CORS setup fails", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("CORS denied"))
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { ensureStorageReady } = await import("@/lib/storage/s3")
    await ensureStorageReady()
    expect(warnSpy).toHaveBeenCalledWith(
      "[storage] Bucket CORS setup skipped:",
      expect.any(Error)
    )
    warnSpy.mockRestore()
  })
})
