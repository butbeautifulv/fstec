import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { getImportRoutingSuggestions } from "@/lib/measure-imports"
import { parseRouteId } from "@/lib/api/route-handler"
import { handleApiError, jsonOk } from "@/lib/api/errors"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id } = await context.params
    const importId = parseRouteId(id)
    const url = new URL(request.url)
    const organizationId = Number(url.searchParams.get("organizationId"))
    if (!Number.isFinite(organizationId)) {
      return jsonOk({ error: "ORGANIZATION_ID_REQUIRED" }, { status: 400 })
    }

    const suggestions = await getImportRoutingSuggestions(importId, organizationId)
    return jsonOk({ suggestions })
  } catch (error) {
    return handleApiError(error)
  }
}
