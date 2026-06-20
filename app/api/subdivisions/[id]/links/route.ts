import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { revokeAccessLinkFromRequest } from "@/lib/access-links/revoke-from-request"
import { createSubdivisionAccessLink } from "@/lib/access-links"
import { revalidatePanelOrganizations } from "@/lib/api/revalidate-panel"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const subdivisionId = Number((await params).id)
    const sub = await prisma.subdivision.findUnique({ where: { id: subdivisionId } })
    if (!sub) throw new Error("NOT_FOUND")
    const link = await createSubdivisionAccessLink(subdivisionId)
    revalidatePanelOrganizations(sub.organizationId)
    return jsonOk(link, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const subdivisionId = Number((await params).id)
    const sub = await prisma.subdivision.findUnique({ where: { id: subdivisionId } })
    if (!sub) throw new Error("NOT_FOUND")
    await revokeAccessLinkFromRequest(request)
    revalidatePanelOrganizations(sub.organizationId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
