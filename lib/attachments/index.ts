import { randomUUID } from "crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { createPutPresignedUrl, createGetPresignedUrl } from "@/lib/storage/s3"
import {
  isAllowedImageMimeType,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_RESPONSE,
  mimeTypeToExtension,
} from "@/lib/storage/config"

export type AttachmentMetaInput = {
  originalName: string
  mimeType: string
  sizeBytes: number
}

export async function createPendingAttachment(
  orderItemId: number,
  meta: AttachmentMetaInput
) {
  if (!isAllowedImageMimeType(meta.mimeType)) {
    throw new Error("INVALID_MIME_TYPE")
  }
  if (meta.sizeBytes <= 0 || meta.sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("INVALID_FILE_SIZE")
  }

  const pendingCount = await prisma.responseAttachment.count({
    where: { orderItemId, responseId: null },
  })
  if (pendingCount >= MAX_ATTACHMENTS_PER_RESPONSE) {
    throw new Error("TOO_MANY_ATTACHMENTS")
  }

  const ext = mimeTypeToExtension(meta.mimeType)
  const storageKey = `attachments/${orderItemId}/${randomUUID()}.${ext}`

  const attachment = await prisma.responseAttachment.create({
    data: {
      orderItemId,
      storageKey,
      originalName: meta.originalName.slice(0, 255),
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
    },
  })

  const uploadUrl = await createPutPresignedUrl(
    storageKey,
    meta.mimeType,
    meta.sizeBytes
  )

  return { attachment, uploadUrl }
}

export async function linkAttachmentsToResponse(
  responseId: number,
  orderItemId: number,
  attachmentIds: number[],
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  if (attachmentIds.length === 0) return

  const uniqueIds = [...new Set(attachmentIds)]
  if (uniqueIds.length > MAX_ATTACHMENTS_PER_RESPONSE) {
    throw new Error("TOO_MANY_ATTACHMENTS")
  }

  const attachments = await db.responseAttachment.findMany({
    where: {
      id: { in: uniqueIds },
      orderItemId,
      responseId: null,
    },
  })

  if (attachments.length !== uniqueIds.length) {
    throw new Error("INVALID_ATTACHMENTS")
  }

  await db.responseAttachment.updateMany({
    where: { id: { in: uniqueIds } },
    data: { responseId },
  })
}

export async function getAttachmentReadUrl(
  attachmentId: number,
  options?: { download?: boolean }
): Promise<string | null> {
  const attachment = await prisma.responseAttachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment) return null
  return createGetPresignedUrl(
    attachment.storageKey,
    options?.download ? { downloadFilename: attachment.originalName } : undefined
  )
}

export async function getAttachmentForPublicToken(token: string, attachmentId: number) {
  const { validateAccessToken } = await import("@/lib/public/validate-token")
  const accessCtx = await validateAccessToken(token)
  if (!accessCtx) return null

  const attachment = await prisma.responseAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      orderItem: { include: { order: true } },
    },
  })
  if (!attachment) return null

  if (attachment.orderItem.order.organizationId !== accessCtx.link.organizationId) {
    return null
  }
  if (
    accessCtx.link.subdivisionId != null &&
    attachment.orderItem.subdivisionId !== accessCtx.link.subdivisionId
  ) {
    return null
  }

  return attachment
}

export async function getAttachmentForReportToken(token: string, attachmentId: number) {
  const { validateReportToken } = await import("@/lib/report-links/validate-token")
  const ctx = await validateReportToken(token)
  if (!ctx) return null

  const attachment = await prisma.responseAttachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment || !attachment.responseId) return null

  return attachment
}

export async function getAttachmentForPanel(attachmentId: number) {
  return prisma.responseAttachment.findUnique({
    where: { id: attachmentId },
  })
}

export async function assertOrderItemExists(orderId: number, orderItemId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, orderId },
    include: { status: true },
  })
  if (!item) throw new Error("NOT_FOUND")
  return item
}
