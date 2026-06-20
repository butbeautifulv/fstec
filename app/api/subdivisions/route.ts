import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrganizations } from "@/lib/api/revalidate-panel"
import { createSubdivision } from "@/lib/organizations"
import { subdivisionSchema } from "@/lib/validations/organizations"

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.orgsWrite)
    const body = await parseJsonBody(request, subdivisionSchema)
    if ("error" in body) return body.error

    const sub = await createSubdivision(body.data.organizationId, body.data.name)
    revalidatePanelOrganizations(body.data.organizationId)
    return jsonOk(sub, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
