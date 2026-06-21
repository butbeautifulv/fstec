import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { deleteContact, updateContact } from "@/lib/contacts"
import { updateContactSchema } from "@/lib/validations/contacts"

type RouteContext = { params: Promise<{ contactId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { contactId } = await context.params
    const id = Number(contactId)
    if (Number.isNaN(id)) return handleApiError(new Error("NOT_FOUND"))

    const body = await parseJsonBody(request, updateContactSchema)
    if ("error" in body) return body.error

    return jsonOk(await updateContact(id, body.data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { contactId } = await context.params
    const id = Number(contactId)
    if (Number.isNaN(id)) return handleApiError(new Error("NOT_FOUND"))

    await deleteContact(id)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
