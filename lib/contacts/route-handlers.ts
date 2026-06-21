import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { parseRouteId } from "@/lib/api/route-handler"
import { createContact, listContacts } from "@/lib/contacts"
import { getSubdivision } from "@/lib/organizations"
import { createContactSchema } from "@/lib/validations/contacts"

type Scope = "org" | "subdivision"

export function createContactCollectionHandlers(scope: Scope) {
  async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
      await requirePermission(Permission.ordersRead)
      const { id } = await context.params
      const entityId = parseRouteId(id)
      const contacts =
        scope === "org"
          ? await listContacts({ organizationId: entityId })
          : await listContacts({ subdivisionId: entityId })
      return jsonOk(contacts)
    } catch (error) {
      return handleApiError(error)
    }
  }

  async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
      await requirePermission(Permission.ordersWrite)
      const { id } = await context.params
      const entityId = parseRouteId(id)

      const body = await parseJsonBody(request, createContactSchema)
      if ("error" in body) return body.error

      let organizationId = entityId
      let subdivisionId: number | null = null

      if (scope === "subdivision") {
        const subdivision = await getSubdivision(entityId)
        if (!subdivision) return handleApiError(new Error("NOT_FOUND"))
        organizationId = subdivision.organizationId
        subdivisionId = entityId
      }

      const contact = await createContact({
        organizationId,
        subdivisionId,
        ...body.data,
      })
      return jsonOk(contact, { status: 201 })
    } catch (error) {
      return handleApiError(error)
    }
  }

  return { GET, POST }
}
