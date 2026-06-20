import { AuthProviderCard } from "@/components/platform/auth-provider-card"
import { PageHeader } from "@/components/shared/page-header"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"
import { authProvidersPayload } from "@/lib/auth/providers"

export default async function AuthSettingsPage() {
  await requirePagePermission(Permission.settingsWrite)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Аутентификация"
        description="Провайдеры входа и интеграции"
        backHref="/panel/settings"
        backLabel="Настройки"
      />
      <AuthProviderCard data={authProvidersPayload()} />
    </div>
  )
}
