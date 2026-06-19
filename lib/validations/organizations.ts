import { z } from "zod"

export const organizationSchema = z.object({
  name: z.string().min(1).max(255),
  shortCode: z.string().max(32).optional().nullable(),
})

export const subdivisionSchema = z.object({
  organizationId: z.number().int().positive(),
  name: z.string().min(1).max(255),
})

export const subdivisionUpdateSchema = z.object({
  name: z.string().min(1).max(255),
})

export type OrganizationInput = z.infer<typeof organizationSchema>
export type SubdivisionInput = z.infer<typeof subdivisionSchema>
export type SubdivisionUpdateInput = z.infer<typeof subdivisionUpdateSchema>
