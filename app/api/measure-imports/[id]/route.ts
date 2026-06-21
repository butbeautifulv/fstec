import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { deleteMeasureImport, getMeasureImport } from "@/lib/measure-imports"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.measuresRead)
    const { id } = await context.params
    const importId = Number(id)
    if (Number.isNaN(importId)) return handleApiError(new Error("NOT_FOUND"))

    const record = await getMeasureImport(importId)
    if (!record) return handleApiError(new Error("NOT_FOUND"))

    return jsonOk(record)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.measuresWrite)
    const { id } = await context.params
    const importId = Number(id)
    if (Number.isNaN(importId)) return handleApiError(new Error("NOT_FOUND"))

    await deleteMeasureImport(importId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
