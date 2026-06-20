import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import {
  createOrganizationAccessLink,
  getOrganizationLinks,
  revokeAccessLink,
} from "@/lib/access-links"
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
    revalidatePath(`/admin/organizations/${organizationId}`)
    return jsonOk(link, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const organizationId = Number((await params).id)
    const linkId = Number(new URL(request.url).searchParams.get("linkId"))
    if (!linkId) return handleApiError(new Error("linkId required"))
    await revokeAccessLink(linkId)
    revalidatePath(`/admin/organizations/${organizationId}`)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
