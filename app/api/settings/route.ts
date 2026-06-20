import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
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
    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }
    const settings = await updateAppSettings(parsed.data)
    revalidatePath("/panel/settings")
    revalidatePath("/panel/settings/general")
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
