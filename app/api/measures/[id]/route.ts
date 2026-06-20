import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelMeasures } from "@/lib/api/revalidate-panel"
import { deleteMeasure, getMeasure, updateMeasure } from "@/lib/measures"
import { measureSchema } from "@/lib/validations/measures"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresRead)
    const id = Number((await params).id)
    const measure = await getMeasure(id)
    if (!measure) throw new Error("NOT_FOUND")
    return jsonOk(measure)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresWrite)
    const id = Number((await params).id)
    const body = await parseJsonBody(request, measureSchema)
    if ("error" in body) return body.error

    const measure = await updateMeasure(id, body.data)
    revalidatePanelMeasures(id)
    return jsonOk(measure)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresWrite)
    const id = Number((await params).id)
    await deleteMeasure(id)
    revalidatePanelMeasures()
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
