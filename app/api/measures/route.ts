import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { createMeasure, listMeasures } from "@/lib/measures"
import { measureSchema } from "@/lib/validations/measures"

export async function GET() {
  try {
    await requirePermission(Permission.measuresRead)
    return jsonOk(await listMeasures())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.measuresWrite)
    const parsed = measureSchema.safeParse(await request.json())
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const measure = await createMeasure(parsed.data, session.userId)
    revalidatePath("/admin/measures")
    return jsonOk(measure, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
