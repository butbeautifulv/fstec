import { z } from "zod"

export const orderItemInputSchema = z.object({
  measureId: z.number().int().positive(),
  dueAt: z.coerce.date(),
  statusId: z.number().int().positive().optional(),
  subdivisionId: z.number().int().positive().optional().nullable(),
})

export const createOrderSchema = z.object({
  title: z.string().min(1).max(500),
  organizationId: z.number().int().positive(),
  defaultDueAt: z.coerce.date().optional().nullable(),
  sourceImportId: z.number().int().positive().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1),
})

export const updateOrderSchema = z.object({
  title: z.string().min(1).max(500),
})

export const orderItemUpdateSchema = z.object({
  statusId: z.number().int().positive().optional(),
  dueAt: z.coerce.date().optional(),
  subdivisionId: z.number().int().positive().optional().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type OrderItemUpdateInput = z.infer<typeof orderItemUpdateSchema>
