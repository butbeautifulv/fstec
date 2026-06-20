import { SettingsHubClient } from "@/components/platform/settings-hub-client"
import { requirePageSession } from "@/lib/auth/page-guard"

export default async function SettingsPage() {
  await requirePageSession()
  return <SettingsHubClient />
}
