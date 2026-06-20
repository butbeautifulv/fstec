import { authProvidersPayload } from "@/lib/auth/providers"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"

export async function GET() {
  try {
    await requirePermission(Permission.settingsRead)
    return jsonOk(authProvidersPayload())
  } catch (error) {
    return handleApiError(error)
  }
}
