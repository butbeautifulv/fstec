import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { createContact, listSubdivisionContacts } from "@/lib/contacts"
import { getSubdivision } from "@/lib/organizations"
import { createContactSchema } from "@/lib/validations/contacts"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersRead)
    const { id } = await context.params
    const subdivisionId = Number(id)
    if (Number.isNaN(subdivisionId)) return handleApiError(new Error("NOT_FOUND"))
    return jsonOk(await listSubdivisionContacts(subdivisionId))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requirePermission(Permission.ordersWrite)
    const { id } = await context.params
    const subdivisionId = Number(id)
    if (Number.isNaN(subdivisionId)) return handleApiError(new Error("NOT_FOUND"))

    const body = await parseJsonBody(request, createContactSchema)
    if ("error" in body) return body.error

    const subdivision = await getSubdivision(subdivisionId)
    if (!subdivision) return handleApiError(new Error("NOT_FOUND"))

    const contact = await createContact({
      organizationId: subdivision.organizationId,
      subdivisionId,
      ...body.data,
    })
    return jsonOk(contact, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
