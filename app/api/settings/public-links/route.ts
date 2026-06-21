import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { listPublicLinkScopes } from "@/lib/public-links/list-scopes"

export async function GET() {
  try {
    await requirePermission(Permission.settingsWrite)
    const scopes = await listPublicLinkScopes()
    return jsonOk({ scopes })
  } catch (error) {
    return handleApiError(error)
  }
}
