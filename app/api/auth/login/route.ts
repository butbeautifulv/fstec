import { getAuthProvider } from "@/lib/auth/providers"
import { getSession } from "@/lib/auth/session"
import { loginSchema } from "@/lib/validations/auth"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, loginSchema)
    if ("error" in body) return body.error

    const result = await getAuthProvider().authenticate(body.data)
    if (!result.ok) {
      return jsonError(result.error, result.status ?? 401)
    }

    const session = await getSession()
    session.userId = result.user.id
    session.email = result.user.email
    session.role = result.user.role
    session.isLoggedIn = true
    session.mustChangePassword = result.user.mustChangePassword
    await session.save()

    return jsonOk({
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      mustChangePassword: result.user.mustChangePassword,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
