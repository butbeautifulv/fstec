import { z } from "zod"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelOrganizations } from "@/lib/api/revalidate-panel"
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  updateOrganization,
} from "@/lib/organizations"
import { organizationSchema } from "@/lib/validations/organizations"

const updateOrganizationSchema = organizationSchema.extend({
  id: z.number().int().positive(),
})

export async function GET() {
  try {
    await requirePermission(Permission.orgsRead)
    const orgs = await listOrganizations()
    return jsonOk(orgs)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.orgsWrite)
    const body = await parseJsonBody(request, organizationSchema)
    if ("error" in body) return body.error

    const org = await createOrganization(body.data)
    revalidatePanelOrganizations()
    return jsonOk(org, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(Permission.orgsWrite)
    const body = await parseJsonBody(request, updateOrganizationSchema)
    if ("error" in body) return body.error

    const org = await updateOrganization(body.data.id, body.data)
    revalidatePanelOrganizations(body.data.id)
    return jsonOk(org)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission(Permission.orgsWrite)
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!id) return handleApiError(new Error("id required"))
    await deleteOrganization(id)
    revalidatePanelOrganizations()
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
