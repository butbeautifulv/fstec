import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import {
  addManualImportItem,
  getMeasureImport,
  updateMeasureImportItems,
} from "@/lib/measure-imports"
import { updateMeasureImportItemsSchema } from "@/lib/validations/measure-imports"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.measuresWrite)
    const { id } = await context.params
    const importId = Number(id)
    if (Number.isNaN(importId)) return handleApiError(new Error("NOT_FOUND"))

    const body = await parseJsonBody(request, updateMeasureImportItemsSchema)
    if ("error" in body) return body.error

    const record = await updateMeasureImportItems(importId, body.data.items)
    return jsonOk(record)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.measuresWrite)
    const { id } = await context.params
    const importId = Number(id)
    if (Number.isNaN(importId)) return handleApiError(new Error("NOT_FOUND"))

    const item = await addManualImportItem(importId)
    const record = await getMeasureImport(importId)
    return jsonOk({ item, record }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
