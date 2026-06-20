import { AuthProviderCard } from "@/components/admin/auth-provider-card"
import { PageHeader } from "@/components/admin/page-header"
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
        backHref="/admin/settings"
        backLabel="Настройки"
      />
      <AuthProviderCard data={authProvidersPayload()} />
    </div>
  )
}
