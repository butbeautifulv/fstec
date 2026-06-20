import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelUsers } from "@/lib/api/revalidate-panel"
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
    const body = await parseJsonBody(request, createUserSchema)
    if ("error" in body) return body.error

    const user = await createUser(body.data)
    revalidatePanelUsers()
    return jsonOk(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return jsonError("Email уже занят", 409)
    }
    return handleApiError(error)
  }
}
