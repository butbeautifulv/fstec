import { revalidatePath } from "next/cache"
import { verifyPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { getUserById, updateUser, deleteUser } from "@/lib/users"
import { deleteUserConfirmSchema, updateUserSchema } from "@/lib/validations/users"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.usersManage)
    const id = Number((await params).id)
    const user = await getUserById(id)
    if (!user) return jsonError("Not found", 404)
    return jsonOk(user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requirePermission(Permission.usersManage)
    const id = Number((await params).id)
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const user = await updateUser(id, parsed.data, { actorId: session.userId })
    revalidatePath("/panel/settings/users")
    revalidatePath(`/panel/settings/users/${id}/edit`)
    return jsonOk(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") return jsonError("Not found", 404)
      if (error.message === "EMAIL_EXISTS") return jsonError("Email уже занят", 409)
      if (error.message === "LAST_SUPER_ADMIN") {
        return jsonError("Нельзя понизить роль последнего суперадминистратора", 409)
      }
    }
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requirePermission(Permission.usersManage)
    const id = Number((await params).id)
    const body = await request.json()
    const parsed = deleteUserConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const actor = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!actor || !(await verifyPassword(parsed.data.password, actor.passwordHash))) {
      return jsonError("Неверный пароль", 400)
    }

    await deleteUser(id, session.userId)
    revalidatePath("/panel/settings/users")
    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") return jsonError("Not found", 404)
      if (error.message === "CANNOT_DELETE_SELF") {
        return jsonError("Нельзя удалить собственную учётную запись", 409)
      }
      if (error.message === "LAST_SUPER_ADMIN") {
        return jsonError("Нельзя удалить последнего суперадминистратора", 409)
      }
      if (error.message === "USER_HAS_DATA") {
        return jsonError(
          "Нельзя удалить пользователя: есть связанные меры или поручения",
          409
        )
      }
    }
    return handleApiError(error)
  }
}
