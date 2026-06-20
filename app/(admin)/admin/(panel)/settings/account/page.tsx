import { AccountSettingsClient } from "@/components/admin/account-settings-client"
import { requirePageSession } from "@/lib/auth/page-guard"
import { isLocaleId } from "@/lib/i18n/locales"
import { getUserById } from "@/lib/users"
import { notFound } from "next/navigation"

export default async function AccountSettingsPage() {
  const session = await requirePageSession()
  const user = await getUserById(session.userId)
  if (!user) notFound()

  return (
    <AccountSettingsClient
      initialAccount={{
        email: user.email,
        name: user.name,
        role: user.role,
        locale: user.locale && isLocaleId(user.locale) ? user.locale : null,
      }}
    />
  )
}
