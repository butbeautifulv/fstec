import { NextResponse } from "next/server"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { parseRouteId } from "@/lib/api/route-handler"
import { handleApiError } from "@/lib/api/errors"
import { getMeasureImport } from "@/lib/measure-imports"
import { getRegulatoryDocDownloadUrl } from "@/lib/regulatory-docs/storage"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.measuresRead)
    const { id } = await context.params
    const importId = parseRouteId(id)

    const record = await getMeasureImport(importId)
    if (!record) return handleApiError(new Error("NOT_FOUND"))

    const url = await getRegulatoryDocDownloadUrl(record.storageKey, record.originalName)
    return NextResponse.redirect(url)
  } catch (error) {
    return handleApiError(error)
  }
}
