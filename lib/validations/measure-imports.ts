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
