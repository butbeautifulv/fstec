import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
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

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401)
    }

    const session = await getSession()
    session.userId = user.id
    session.email = user.email
    session.isLoggedIn = true
    await session.save()

    return jsonOk({ email: user.email, name: user.name })
  } catch (error) {
    return handleApiError(error)
  }
}
