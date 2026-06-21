import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { commitMeasureImport } from "@/lib/measure-imports/commit"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requirePermission(Permission.measuresWrite)
    const { id } = await context.params
    const importId = Number(id)
    if (Number.isNaN(importId)) return handleApiError(new Error("NOT_FOUND"))

    const record = await commitMeasureImport(importId, session.userId)
    return jsonOk(record)
  } catch (error) {
    return handleApiError(error)
  }
}
