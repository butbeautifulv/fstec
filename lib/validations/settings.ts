import { z } from "zod"
import { TIMEZONE_OPTIONS } from "@/lib/datetime/timezones"
import { LOCALE_IDS } from "@/lib/i18n/locales"

const timezoneIds = TIMEZONE_OPTIONS.map((z) => z.id) as [string, ...string[]]

export const updateSettingsSchema = z.object({
  headOrganizationId: z.number().int().positive().nullable().optional(),
  timezone: z.enum(timezoneIds).optional(),
  locale: z.enum(LOCALE_IDS).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
