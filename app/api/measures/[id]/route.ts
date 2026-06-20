import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { deleteMeasure, getMeasure, updateMeasure } from "@/lib/measures"
import { measureSchema } from "@/lib/validations/measures"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresRead)
    const id = Number((await params).id)
    const measure = await getMeasure(id)
    if (!measure) throw new Error("NOT_FOUND")
    return jsonOk(measure)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresWrite)
    const id = Number((await params).id)
    const parsed = measureSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const measure = await updateMeasure(id, parsed.data)
    revalidatePath("/admin/measures")
    revalidatePath(`/admin/measures/${id}/edit`)
    return jsonOk(measure)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.measuresWrite)
    const id = Number((await params).id)
    await deleteMeasure(id)
    revalidatePath("/admin/measures")
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
