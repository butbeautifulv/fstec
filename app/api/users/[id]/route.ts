import { verifyPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelUsers } from "@/lib/api/revalidate-panel"
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
    const body = await parseJsonBody(request, updateUserSchema)
    if ("error" in body) return body.error

    const user = await updateUser(id, body.data, { actorId: session.userId })
    revalidatePanelUsers(id)
    return jsonOk(user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requirePermission(Permission.usersManage)
    const id = Number((await params).id)
    const body = await parseJsonBody(request, deleteUserConfirmSchema)
    if ("error" in body) return body.error

    const actor = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!actor || !(await verifyPassword(body.data.password, actor.passwordHash))) {
      return jsonError("Неверный пароль", 400)
    }

    await deleteUser(id, session.userId)
    revalidatePanelUsers()
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
