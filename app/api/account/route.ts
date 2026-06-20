import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { updateAccount } from "@/lib/users"
import { updateAccountSchema } from "@/lib/validations/account"

export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession()
    const body = await request.json()
    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const user = await updateAccount(session.userId, parsed.data)
    revalidatePath("/admin/settings/account")
    return jsonOk(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS") return jsonError("Email уже занят", 409)
      if (error.message === "INVALID_CURRENT_PASSWORD") {
        return jsonError("Неверный текущий пароль", 400)
      }
    }
    return handleApiError(error)
  }
}
