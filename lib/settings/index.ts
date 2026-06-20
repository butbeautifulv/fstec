import { cache } from "react"
import { prisma } from "@/lib/db"
import { DEFAULT_LOCALE } from "@/lib/i18n/locales"
import { DEFAULT_TIMEZONE } from "@/lib/datetime/timezones"
import type { UpdateSettingsInput } from "@/lib/validations/settings"

const SETTINGS_ID = 1

export async function ensureAppSettings() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, timezone: DEFAULT_TIMEZONE, locale: DEFAULT_LOCALE },
  })
}

export async function getAppSettings() {
  await ensureAppSettings()
  return prisma.appSettings.findUniqueOrThrow({
    where: { id: SETTINGS_ID },
    include: { headOrganization: true },
  })
}

export async function getPublicSettings() {
  const settings = await getAppSettings()
  return {
    timezone: settings.timezone,
    locale: settings.locale,
    headOrganization: settings.headOrganization
      ? { id: settings.headOrganization.id, name: settings.headOrganization.name }
      : null,
  }
}

export async function getPublicTimezone() {
  const settings = await getAppSettings()
  return settings.timezone
}

export async function updateAppSettings(data: UpdateSettingsInput) {
  await ensureAppSettings()

  if (data.headOrganizationId != null) {
    const org = await prisma.organization.findUnique({
      where: { id: data.headOrganizationId },
    })
    if (!org) throw new Error("NOT_FOUND")
  }

  return prisma.appSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      ...(data.headOrganizationId !== undefined && {
        headOrganizationId: data.headOrganizationId,
      }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.locale !== undefined && { locale: data.locale }),
    },
    include: { headOrganization: true },
  })
}

export const getHeadOrganizationId = cache(async () => {
  await ensureAppSettings()
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { headOrganizationId: true },
  })
  return settings?.headOrganizationId ?? null
})
