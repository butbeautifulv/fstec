import type { ContactRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { dedupeAndSortContacts } from "@/lib/contacts/dedupe-contacts"

export { dedupeAndSortContacts } from "@/lib/contacts/dedupe-contacts"

export function getContactsListWhere(input: {
  organizationId?: number
  subdivisionId?: number | null
}) {
  return input.subdivisionId != null
    ? { subdivisionId: input.subdivisionId }
    : { organizationId: input.organizationId!, subdivisionId: null }
}

export function listContacts(input: {
  organizationId?: number
  subdivisionId?: number | null
}) {
  return prisma.contactPerson.findMany({
    where: getContactsListWhere(input),
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  })
}

export function listOrganizationContacts(organizationId: number) {
  return listContacts({ organizationId })
}

export function listAllOrganizationContacts(organizationId: number) {
  return prisma.contactPerson.findMany({
    where: { organizationId },
    include: { subdivision: { select: { id: true, name: true } } },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  })
}

export function listSubdivisionContacts(subdivisionId: number) {
  return listContacts({ subdivisionId })
}

export async function resolveContactsForTarget(input: {
  organizationId: number
  subdivisionId?: number | null
}) {
  const subdivisionContacts =
    input.subdivisionId != null
      ? await prisma.contactPerson.findMany({
          where: {
            subdivisionId: input.subdivisionId,
            isActive: true,
          },
        })
      : []

  const orgContacts =
    subdivisionContacts.length > 0
      ? []
      : await prisma.contactPerson.findMany({
          where: {
            organizationId: input.organizationId,
            subdivisionId: null,
            isActive: true,
          },
        })

  const contacts = subdivisionContacts.length > 0 ? subdivisionContacts : orgContacts

  return dedupeAndSortContacts(contacts)
}

async function assertPrimaryUnique(input: {
  organizationId: number
  subdivisionId?: number | null
  role: ContactRole
  excludeId?: number
}) {
  if (input.role !== "PRIMARY") return

  const existing = await prisma.contactPerson.findFirst({
    where: {
      organizationId: input.organizationId,
      subdivisionId: input.subdivisionId ?? null,
      role: "PRIMARY",
      isActive: true,
      ...(input.excludeId != null ? { id: { not: input.excludeId } } : {}),
    },
  })

  if (existing) throw new Error("PRIMARY_CONTACT_EXISTS")
}

export async function createContact(input: {
  organizationId: number
  subdivisionId?: number | null
  fullName: string
  position?: string | null
  email: string
  role: ContactRole
}) {
  if (input.subdivisionId != null) {
    const subdivision = await prisma.subdivision.findFirst({
      where: { id: input.subdivisionId, organizationId: input.organizationId },
    })
    if (!subdivision) throw new Error("NOT_FOUND")
  }

  await assertPrimaryUnique(input)

  return prisma.contactPerson.create({
    data: {
      organizationId: input.organizationId,
      subdivisionId: input.subdivisionId ?? null,
      fullName: input.fullName,
      position: input.position ?? null,
      email: input.email,
      role: input.role,
    },
  })
}

export async function updateContact(
  id: number,
  input: {
    fullName?: string
    position?: string | null
    email?: string
    role?: ContactRole
    isActive?: boolean
    subdivisionId?: number | null
  }
) {
  const existing = await prisma.contactPerson.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")

  let subdivisionId = existing.subdivisionId
  if (input.subdivisionId !== undefined) {
    if (input.subdivisionId != null) {
      const subdivision = await prisma.subdivision.findFirst({
        where: {
          id: input.subdivisionId,
          organizationId: existing.organizationId,
        },
      })
      if (!subdivision) throw new Error("NOT_FOUND")
      subdivisionId = input.subdivisionId
    } else {
      subdivisionId = null
    }
  }

  const role = input.role ?? existing.role
  await assertPrimaryUnique({
    organizationId: existing.organizationId,
    subdivisionId,
    role,
    excludeId: id,
  })

  return prisma.contactPerson.update({
    where: { id },
    data: {
      ...(input.fullName != null ? { fullName: input.fullName } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.email != null ? { email: input.email } : {}),
      ...(input.role != null ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.subdivisionId !== undefined ? { subdivisionId } : {}),
    },
    include: { subdivision: { select: { id: true, name: true } } },
  })
}

export async function deleteContact(id: number) {
  const existing = await prisma.contactPerson.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")
  return prisma.contactPerson.delete({ where: { id } })
}
