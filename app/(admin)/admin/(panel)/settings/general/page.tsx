import { GeneralSettingsClient } from "@/components/admin/general-settings-client"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"
import { DEFAULT_LOCALE, isLocaleId } from "@/lib/i18n/locales"
import { getAppSettings } from "@/lib/settings"
import { listOrganizations } from "@/lib/organizations"

export default async function GeneralSettingsPage() {
  await requirePagePermission(Permission.settingsWrite)

  const [settings, organizations] = await Promise.all([
    getAppSettings(),
    listOrganizations(),
  ])

  return (
    <GeneralSettingsClient
      initialSettings={{
        headOrganizationId: settings.headOrganizationId,
        timezone: settings.timezone,
        locale: isLocaleId(settings.locale) ? settings.locale : DEFAULT_LOCALE,
      }}
      organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
    />
  )
}
