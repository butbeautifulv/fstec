export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_RESPONSE = 10
export const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60

export type S3Config = {
  endpoint: string
  region: string
  accessKey: string
  secretKey: string
  bucket: string
  forcePathStyle: boolean
}

let cachedConfig: S3Config | null = null

export function getS3Config(): S3Config {
  if (cachedConfig) return cachedConfig

  const endpoint = process.env.S3_ENDPOINT
  const accessKey = process.env.S3_ACCESS_KEY
  const secretKey = process.env.S3_SECRET_KEY
  const bucket = process.env.S3_BUCKET

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    throw new Error("S3 storage is not configured")
  }

  cachedConfig = {
    endpoint,
    region: process.env.S3_REGION ?? "us-east-1",
    accessKey,
    secretKey,
    bucket,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  }

  return cachedConfig
}

export function isAllowedImageMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function mimeTypeToExtension(mimeType: AllowedImageMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
  }
}
