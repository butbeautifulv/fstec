import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { createUser, listUsers } from "@/lib/users"
import { createUserSchema } from "@/lib/validations/users"

export async function GET() {
  try {
    await requirePermission(Permission.usersManage)
    const users = await listUsers()
    return jsonOk(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.usersManage)
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }
    const user = await createUser(parsed.data)
    revalidatePath("/admin/settings/users")
    return jsonOk(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return jsonError("Email уже занят", 409)
    }
    return handleApiError(error)
  }
}
