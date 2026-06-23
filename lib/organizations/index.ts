import { prisma } from "@/lib/db"
import { getHeadOrganizationId } from "@/lib/settings"
import type { OrganizationInput } from "@/lib/validations/organizations"

export function listOrganizations() {
  return prisma.organization.findMany({
    include: { subdivisions: true, _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  })
}

export async function listSupervisedOrganizations() {
  const headOrganizationId = await getHeadOrganizationId()
  return prisma.organization.findMany({
    where: headOrganizationId != null ? { id: { not: headOrganizationId } } : undefined,
    include: {
      subdivisions: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  })
}

export async function listBatchOrganizations() {
  const headOrganizationId = await getHeadOrganizationId()
  const organizations = await prisma.organization.findMany({
    include: {
      subdivisions: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  })

  if (headOrganizationId != null) {
    organizations.sort((a, b) => {
      if (a.id === headOrganizationId) return -1
      if (b.id === headOrganizationId) return 1
      return a.name.localeCompare(b.name)
    })
  }

  return { headOrganizationId, organizations }
}

export function getOrganization(id: number) {
  return prisma.organization.findUnique({
    where: { id },
    include: { subdivisions: true },
  })
}

export function getSubdivision(id: number) {
  return prisma.subdivision.findUnique({
    where: { id },
  })
}

export function createOrganization(data: OrganizationInput) {
  return prisma.organization.create({
    data: {
      name: data.name,
      shortCode: data.shortCode ?? null,
    },
  })
}

export function updateOrganization(id: number, data: OrganizationInput) {
  return prisma.organization.update({
    where: { id },
    data: {
      name: data.name,
      shortCode: data.shortCode ?? null,
    },
  })
}

export async function deleteOrganization(id: number) {
  const orders = await prisma.order.count({ where: { organizationId: id } })
  if (orders > 0) throw new Error("ORG_HAS_ORDERS")
  return prisma.organization.delete({ where: { id } })
}

export function createSubdivision(organizationId: number, name: string) {
  return prisma.subdivision.create({
    data: { organizationId, name },
  })
}

export function updateSubdivision(id: number, name: string) {
  return prisma.subdivision.update({
    where: { id },
    data: { name },
  })
}

export function deleteSubdivision(id: number) {
  return prisma.subdivision.delete({ where: { id } })
}
