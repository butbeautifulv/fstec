import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelMeasures } from "@/lib/api/revalidate-panel"
import { createMeasure, listMeasures } from "@/lib/measures"
import { measureSchema } from "@/lib/validations/measures"

export async function GET() {
  try {
    await requirePermission(Permission.measuresRead)
    return jsonOk(await listMeasures())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.measuresWrite)
    const body = await parseJsonBody(request, measureSchema)
    if ("error" in body) return body.error

    const measure = await createMeasure(body.data, session.userId)
    revalidatePanelMeasures()
    return jsonOk(measure, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
