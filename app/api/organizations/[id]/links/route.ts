import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { revokeAccessLinkFromRequest } from "@/lib/access-links/revoke-from-request"
import {
  createOrganizationAccessLink,
  getOrganizationLinks,
} from "@/lib/access-links"
import { revalidatePanelOrganizations } from "@/lib/api/revalidate-panel"
import { getOrganization } from "@/lib/organizations"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsRead)
    const organizationId = Number((await params).id)
    const org = await getOrganization(organizationId)
    if (!org) throw new Error("NOT_FOUND")
    const links = await getOrganizationLinks(organizationId)
    return jsonOk({ organization: org, links })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const organizationId = Number((await params).id)
    const org = await getOrganization(organizationId)
    if (!org) throw new Error("NOT_FOUND")
    const link = await createOrganizationAccessLink(organizationId)
    revalidatePanelOrganizations(organizationId)
    return jsonOk(link, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const organizationId = Number((await params).id)
    await revokeAccessLinkFromRequest(request)
    revalidatePanelOrganizations(organizationId)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
