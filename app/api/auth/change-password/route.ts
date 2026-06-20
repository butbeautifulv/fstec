import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { getSession, requireAdminSession } from "@/lib/auth/session"
import { changeUserPassword } from "@/lib/users"
import { changePasswordSchema } from "@/lib/validations/auth"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()
    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return jsonError("Unauthorized", 401)

    const validCurrent = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash
    )
    if (!validCurrent) {
      return jsonError("Неверный текущий пароль", 400)
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return jsonError("Новый пароль должен отличаться от текущего", 400)
    }

    await changeUserPassword(session.userId, parsed.data.newPassword)

    const ironSession = await getSession()
    ironSession.mustChangePassword = false
    await ironSession.save()

    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
