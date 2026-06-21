import { PublicLinksManager } from "@/components/platform/public-links-manager"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"
import { listPublicLinkScopes } from "@/lib/public-links/list-scopes"

export default async function PublicLinksSettingsPage() {
  await requirePagePermission(Permission.settingsWrite)
  const scopes = await listPublicLinkScopes()

  return <PublicLinksManager initialScopes={scopes} />
}
