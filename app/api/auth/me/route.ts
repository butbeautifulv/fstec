import { getPermissionsForRole } from "@/lib/auth/permissions"
import { requireAdminSession } from "@/lib/auth/session"
import { resolveLocale } from "@/lib/i18n/locales"
import { getPublicSettings } from "@/lib/settings"
import { getUserById } from "@/lib/users"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"

export async function GET() {
  try {
    const session = await requireAdminSession()
    const [user, publicSettings] = await Promise.all([
      getUserById(session.userId),
      getPublicSettings(),
    ])
    if (!user) return jsonError("Unauthorized", 401)

    const effectiveLocale = resolveLocale(user.locale, publicSettings.locale)

    return jsonOk({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      locale: user.locale,
      effectiveLocale,
      permissions: getPermissionsForRole(user.role),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
