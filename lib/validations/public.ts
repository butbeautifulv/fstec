import { z } from "zod"
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/storage/config"

export const responseSchema = z.object({
  result: z.string().min(1).max(5000),
  commentary: z.string().max(5000).optional().nullable(),
  submittedByLabel: z.string().max(255).optional().nullable(),
  subdivisionId: z.number().int().positive().optional().nullable(),
  attachmentIds: z.array(z.number().int().positive()).max(10).optional(),
})

export const attachmentPresignSchema = z.object({
  originalName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  sizeBytes: z.number().int().positive(),
})

export const delayRequestSchema = z.object({
  requestedDueAt: z.coerce.date(),
  justification: z.string().max(2000).optional().nullable(),
})

export const statusActionSchema = z.object({
  action: z.literal("start"),
})

export type ResponseInput = z.infer<typeof responseSchema>
export type AttachmentPresignInput = z.infer<typeof attachmentPresignSchema>
export type DelayRequestInput = z.infer<typeof delayRequestSchema>
