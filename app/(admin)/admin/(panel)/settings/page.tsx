import { SettingsHubClient } from "@/components/admin/settings-hub-client"
import { requirePageSession } from "@/lib/auth/page-guard"

export default async function SettingsPage() {
  await requirePageSession()
  return <SettingsHubClient />
}
