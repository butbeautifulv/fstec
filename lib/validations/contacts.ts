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
  subdivisionId: z.number().int().positive().nullable().optional(),
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

export const CONTACT_ROLE_HINTS: Record<
  z.infer<typeof contactRoleSchema>,
  string
> = {
  PRIMARY: "Один на область — основной получатель оповещений",
  RESPONSIBLE: "Ответственный за исполнение в области",
  NOTIFY: "Дополнительный адрес для копий оповещений",
}

export const ORG_CONTACT_SCOPE_LABEL = "Вся организация"
