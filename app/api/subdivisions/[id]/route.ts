import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrganizations } from "@/lib/api/revalidate-panel"
import { deleteSubdivision, updateSubdivision } from "@/lib/organizations"
import { subdivisionUpdateSchema } from "@/lib/validations/organizations"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const id = Number((await params).id)
    const body = await parseJsonBody(request, subdivisionUpdateSchema)
    if ("error" in body) return body.error

    const sub = await updateSubdivision(id, body.data.name)
    revalidatePanelOrganizations(sub.organizationId)
    return jsonOk(sub)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const id = Number((await params).id)
    const sub = await prisma.subdivision.findUnique({ where: { id } })
    if (!sub) throw new Error("NOT_FOUND")
    await deleteSubdivision(id)
    revalidatePanelOrganizations(sub.organizationId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
