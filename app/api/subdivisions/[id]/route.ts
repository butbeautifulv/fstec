import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { deleteSubdivision, updateSubdivision } from "@/lib/organizations"
import { subdivisionUpdateSchema } from "@/lib/validations/organizations"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const id = Number((await params).id)
    const parsed = subdivisionUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const sub = await updateSubdivision(id, parsed.data.name)
    revalidatePath("/admin/organizations")
    revalidatePath(`/admin/organizations/${sub.organizationId}`)
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
    revalidatePath("/admin/organizations")
    revalidatePath(`/admin/organizations/${sub.organizationId}`)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
