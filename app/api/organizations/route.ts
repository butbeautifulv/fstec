import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  updateOrganization,
} from "@/lib/organizations"
import { organizationSchema } from "@/lib/validations/organizations"

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
    const body = await request.json()
    const parsed = organizationSchema.safeParse(body)
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const org = await createOrganization(parsed.data)
    revalidatePath("/admin/organizations")
    return jsonOk(org, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(Permission.orgsWrite)
    const body = await request.json()
    const id = Number(body.id)
    if (!id) return handleApiError(new Error("id required"))
    const parsed = organizationSchema.safeParse(body)
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const org = await updateOrganization(id, parsed.data)
    revalidatePath("/admin/organizations")
    revalidatePath(`/admin/organizations/${id}`)
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
    revalidatePath("/admin/organizations")
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
