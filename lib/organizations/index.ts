import { prisma } from "@/lib/db"
import type { OrganizationInput } from "@/lib/validations/organizations"

export function listOrganizations() {
  return prisma.organization.findMany({
    include: { subdivisions: true, _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  })
}

export function getOrganization(id: number) {
  return prisma.organization.findUnique({
    where: { id },
    include: { subdivisions: true },
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
