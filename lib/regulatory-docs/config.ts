export const ALLOWED_REGULATORY_DOC_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
] as const

export type AllowedRegulatoryDocMimeType =
  (typeof ALLOWED_REGULATORY_DOC_MIME_TYPES)[number]

export const MAX_REGULATORY_DOC_SIZE_BYTES = 20 * 1024 * 1024

export function isAllowedRegulatoryDocMimeType(
  mimeType: string
): mimeType is AllowedRegulatoryDocMimeType {
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/octet-stream"
  )
}

export function isDocxFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith(".docx")
}

export function regulatoryDocStorageKey(importId: number, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 200)
  return `regulatory-docs/${importId}/${safeName}`
}
