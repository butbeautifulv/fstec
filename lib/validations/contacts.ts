import { z } from "zod"

export const contactRoleSchema = z.enum(["PRIMARY", "RESPONSIBLE", "NOTIFY"])

export const createContactSchema = z.object({
  fullName: z.string().min(1).max(200),
  position: z.string().max(200).nullable().optional(),
  email: z.string().email().max(255),
  role: contactRoleSchema.default("RESPONSIBLE"),
})

export const updateContactSchema = createContactSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export const CONTACT_ROLE_LABELS: Record<
  z.infer<typeof contactRoleSchema>,
  string
> = {
  PRIMARY: "Главный ответственный",
  RESPONSIBLE: "Ответственный",
  NOTIFY: "Для оповещений",
}
