import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { createSubdivision } from "@/lib/organizations"
import { subdivisionSchema } from "@/lib/validations/organizations"

export async function POST(request: Request) {
  try {
    await requireAdminSession()
    const body = await request.json()
    const parsed = subdivisionSchema.safeParse(body)
    if (!parsed.success) {
      return handleApiError(new Error(parsed.error.issues[0]?.message))
    }
    const sub = await createSubdivision(parsed.data.organizationId, parsed.data.name)
    revalidatePath("/admin/organizations")
    revalidatePath(`/admin/organizations/${parsed.data.organizationId}`)
    return jsonOk(sub, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
