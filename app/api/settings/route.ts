import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelSettings } from "@/lib/api/revalidate-panel"
import { getPublicSettings, updateAppSettings } from "@/lib/settings"
import { updateSettingsSchema } from "@/lib/validations/settings"

export async function GET() {
  try {
    return jsonOk(await getPublicSettings())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(Permission.settingsWrite)
    const body = await parseJsonBody(request, updateSettingsSchema)
    if ("error" in body) return body.error

    const settings = await updateAppSettings(body.data)
    revalidatePanelSettings()
    return jsonOk({
      timezone: settings.timezone,
      locale: settings.locale,
      headOrganization: settings.headOrganization
        ? { id: settings.headOrganization.id, name: settings.headOrganization.name }
        : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
