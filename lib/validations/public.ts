import { z } from "zod"

export const responseSchema = z.object({
  result: z.string().min(1).max(5000),
  commentary: z.string().max(5000).optional().nullable(),
  submittedByLabel: z.string().max(255).optional().nullable(),
  subdivisionId: z.number().int().positive().optional().nullable(),
})

export const delayRequestSchema = z.object({
  requestedDueAt: z.coerce.date(),
  justification: z.string().max(2000).optional().nullable(),
})

export const statusActionSchema = z.object({
  action: z.literal("start"),
})

export type ResponseInput = z.infer<typeof responseSchema>
export type DelayRequestInput = z.infer<typeof delayRequestSchema>
