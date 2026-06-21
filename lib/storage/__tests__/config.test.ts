import { afterEach, describe, expect, it, vi } from "vitest"

describe("storage config", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("isAllowedImageMimeType accepts jpeg and rejects pdf", async () => {
    const { isAllowedImageMimeType } = await import("@/lib/storage/config")
    expect(isAllowedImageMimeType("image/jpeg")).toBe(true)
    expect(isAllowedImageMimeType("application/pdf")).toBe(false)
  })

  it("mimeTypeToExtension maps known types", async () => {
    const { mimeTypeToExtension } = await import("@/lib/storage/config")
    expect(mimeTypeToExtension("image/png")).toBe("png")
    expect(mimeTypeToExtension("image/webp")).toBe("webp")
    expect(mimeTypeToExtension("image/jpeg")).toBe("jpg")
    expect(mimeTypeToExtension("image/gif")).toBe("gif")
  })

  it("exports size constants", async () => {
    const config = await import("@/lib/storage/config")
    expect(config.MAX_ATTACHMENT_SIZE_BYTES).toBe(5 * 1024 * 1024)
    expect(config.PRESIGNED_URL_EXPIRY_SECONDS).toBe(15 * 60)
  })

  it("getS3Config throws when env incomplete", async () => {
    const { getS3Config } = await import("@/lib/storage/config")
    expect(() => getS3Config()).toThrow("S3 storage is not configured")
  })

  it("getS3Config reads env and caches", async () => {
    vi.stubEnv("S3_ENDPOINT", "http://minio:9000")
    vi.stubEnv("S3_ACCESS_KEY", "key")
    vi.stubEnv("S3_SECRET_KEY", "secret")
    vi.stubEnv("S3_BUCKET", "bucket")
    vi.stubEnv("S3_REGION", "eu-west-1")
    vi.stubEnv("S3_FORCE_PATH_STYLE", "false")

    const { getS3Config } = await import("@/lib/storage/config")
    const config = getS3Config()
    expect(config).toEqual({
      endpoint: "http://minio:9000",
      region: "eu-west-1",
      accessKey: "key",
      secretKey: "secret",
      bucket: "bucket",
      forcePathStyle: false,
    })
    expect(getS3Config()).toBe(config)
  })

  it("getS3Config defaults region to us-east-1", async () => {
    vi.stubEnv("S3_ENDPOINT", "http://minio:9000")
    vi.stubEnv("S3_ACCESS_KEY", "key")
    vi.stubEnv("S3_SECRET_KEY", "secret")
    vi.stubEnv("S3_BUCKET", "bucket")
    const { getS3Config } = await import("@/lib/storage/config")
    expect(getS3Config().region).toBe("us-east-1")
  })
})
