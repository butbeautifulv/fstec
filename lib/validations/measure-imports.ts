import { z } from "zod"

export const measureImportItemUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(500).optional(),
  code: z.string().max(100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  included: z.boolean().optional(),
})

export const updateMeasureImportItemsSchema = z.object({
  items: z.array(measureImportItemUpdateSchema).min(1),
})

export const batchOrderTargetSchema = z.object({
  organizationId: z.number().int().positive(),
  subdivisionId: z.number().int().positive().nullable().optional(),
})

export const batchCreateOrdersSchema = z.object({
  title: z.string().min(1).max(500),
  defaultDueAt: z.coerce.date(),
  measureIds: z.array(z.number().int().positive()).min(1),
  sourceImportId: z.number().int().positive().optional().nullable(),
  targets: z.array(batchOrderTargetSchema).min(1),
})

export type BatchCreateOrdersInput = z.infer<typeof batchCreateOrdersSchema>
