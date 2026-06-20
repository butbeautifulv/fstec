import { requireAdminSession } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePath } from "next/cache"
import { updateAccount } from "@/lib/users"
import { updateAccountSchema } from "@/lib/validations/account"

export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession()
    const body = await parseJsonBody(request, updateAccountSchema)
    if ("error" in body) return body.error

    const user = await updateAccount(session.userId, body.data)
    revalidatePath("/panel/settings/account")
    return jsonOk(user)
  } catch (error) {
    return handleApiError(error)
  }
}
