import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  getS3Config,
  PRESIGNED_URL_EXPIRY_SECONDS,
  type AllowedImageMimeType,
} from "@/lib/storage/config"

let client: S3Client | null = null
let bucketReady = false
let corsReady = false

function getClient(): S3Client {
  if (client) return client
  const config = getS3Config()
  client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.forcePathStyle,
    // MinIO does not support AWS SDK default flexible checksums on presigned PUT
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
  return client
}

export async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const config = getS3Config()
  const s3 = getClient()
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.bucket }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: config.bucket }))
  }
  bucketReady = true
}

async function ensureBucketCors(): Promise<void> {
  if (corsReady) return
  const config = getS3Config()
  const s3 = getClient()
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: config.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "PUT", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    )
  } catch (error) {
    console.warn("[storage] Bucket CORS setup skipped:", error)
  }
  corsReady = true
}

export async function ensureStorageReady(): Promise<void> {
  await ensureBucket()
  await ensureBucketCors()
}

export async function createPutPresignedUrl(
  storageKey: string,
  mimeType: AllowedImageMimeType,
  _sizeBytes: number
): Promise<string> {
  await ensureStorageReady()
  const config = getS3Config()
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: mimeType,
  })
  return getSignedUrl(getClient(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  })
}

export async function createGetPresignedUrl(
  storageKey: string,
  options?: { downloadFilename?: string }
): Promise<string> {
  await ensureStorageReady()
  const config = getS3Config()
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ...(options?.downloadFilename
      ? {
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(options.downloadFilename)}"`,
        }
      : {}),
  })
  return getSignedUrl(getClient(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  })
}
