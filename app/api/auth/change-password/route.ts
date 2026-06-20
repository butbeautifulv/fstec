import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { getSession, requireAdminSession } from "@/lib/auth/session"
import { changeUserPassword } from "@/lib/users"
import { changePasswordSchema } from "@/lib/validations/auth"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()
    const body = await parseJsonBody(request, changePasswordSchema)
    if ("error" in body) return body.error

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return jsonError("Unauthorized", 401)

    const validCurrent = await verifyPassword(
      body.data.currentPassword,
      user.passwordHash
    )
    if (!validCurrent) {
      return jsonError("Неверный текущий пароль", 400)
    }

    if (body.data.currentPassword === body.data.newPassword) {
      return jsonError("Новый пароль должен отличаться от текущего", 400)
    }

    await changeUserPassword(session.userId, body.data.newPassword)

    const ironSession = await getSession()
    ironSession.mustChangePassword = false
    await ironSession.save()

    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
