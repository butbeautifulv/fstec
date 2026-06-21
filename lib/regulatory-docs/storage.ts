import { createHash } from "crypto"
import {
  createGetPresignedUrl,
  getObjectBuffer,
  putObjectBuffer,
} from "@/lib/storage/s3"

export async function uploadRegulatoryDocBuffer(
  storageKey: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ sha256: string }> {
  const sha256 = createHash("sha256").update(buffer).digest("hex")
  await putObjectBuffer(storageKey, buffer, mimeType)
  return { sha256 }
}

export async function downloadRegulatoryDocBuffer(storageKey: string): Promise<Buffer> {
  return getObjectBuffer(storageKey)
}

export async function getRegulatoryDocDownloadUrl(
  storageKey: string,
  originalName: string
): Promise<string> {
  return createGetPresignedUrl(storageKey, { downloadFilename: originalName })
}
