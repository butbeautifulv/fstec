import { getAuthProvider } from "@/lib/auth/providers"
import { getSession } from "@/lib/auth/session"
import { loginSchema } from "@/lib/validations/auth"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const result = await getAuthProvider().authenticate(parsed.data)
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
