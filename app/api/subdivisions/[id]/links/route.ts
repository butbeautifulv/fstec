import { revalidatePath } from "next/cache"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import {
  createSubdivisionAccessLink,
  revokeAccessLink,
} from "@/lib/access-links"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const subdivisionId = Number((await params).id)
    const sub = await prisma.subdivision.findUnique({ where: { id: subdivisionId } })
    if (!sub) throw new Error("NOT_FOUND")
    const link = await createSubdivisionAccessLink(subdivisionId)
    revalidatePath(`/panel/organizations/${sub.organizationId}`)
    return jsonOk(link, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requirePermission(Permission.orgsWrite)
    const subdivisionId = Number((await params).id)
    const sub = await prisma.subdivision.findUnique({ where: { id: subdivisionId } })
    if (!sub) throw new Error("NOT_FOUND")
    const linkId = Number(new URL(request.url).searchParams.get("linkId"))
    if (!linkId) return handleApiError(new Error("linkId required"))
    await revokeAccessLink(linkId)
    revalidatePath(`/panel/organizations/${sub.organizationId}`)
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
