import { z } from "zod"

export const measureSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  code: z.string().max(100).optional().nullable(),
})

export type MeasureInput = z.infer<typeof measureSchema>
