import type { ContactRole } from "@prisma/client"
import { prisma } from "@/lib/db"

const ROLE_ORDER: Record<ContactRole, number> = {
  PRIMARY: 0,
  RESPONSIBLE: 1,
  NOTIFY: 2,
}

export function listOrganizationContacts(organizationId: number) {
  return prisma.contactPerson.findMany({
    where: { organizationId, subdivisionId: null },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  })
}

export function listSubdivisionContacts(subdivisionId: number) {
  return prisma.contactPerson.findMany({
    where: { subdivisionId },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  })
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

  const deduped = new Map<string, (typeof contacts)[number]>()
  for (const contact of contacts) {
    const key = contact.email.trim().toLowerCase()
    if (!deduped.has(key)) {
      deduped.set(key, contact)
    }
  }

  return [...deduped.values()].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.fullName.localeCompare(b.fullName)
  )
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
  }
) {
  const existing = await prisma.contactPerson.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")

  const role = input.role ?? existing.role
  await assertPrimaryUnique({
    organizationId: existing.organizationId,
    subdivisionId: existing.subdivisionId,
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
    },
  })
}

export async function deleteContact(id: number) {
  const existing = await prisma.contactPerson.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")
  return prisma.contactPerson.delete({ where: { id } })
}
