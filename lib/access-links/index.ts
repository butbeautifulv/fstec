import { prisma } from "@/lib/db"
import { activeLinkWhere } from "@/lib/links/active-where"
import { generateLinkToken } from "@/lib/links/generate-token"

export async function createOrganizationAccessLink(organizationId: number) {
  await revokeActiveLinks(organizationId, null)
  return prisma.accessLink.create({
    data: {
      organizationId,
      subdivisionId: null,
      token: generateLinkToken(),
    },
    include: { subdivision: true },
  })
}

export async function createSubdivisionAccessLink(subdivisionId: number) {
  const subdivision = await prisma.subdivision.findUniqueOrThrow({
    where: { id: subdivisionId },
  })
  await revokeActiveLinks(subdivision.organizationId, subdivisionId)
  return prisma.accessLink.create({
    data: {
      organizationId: subdivision.organizationId,
      subdivisionId,
      token: generateLinkToken(),
    },
    include: { subdivision: true },
  })
}

async function revokeActiveLinks(
  organizationId: number,
  subdivisionId: number | null
) {
  await prisma.accessLink.updateMany({
    where: {
      organizationId,
      subdivisionId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAccessLink(linkId: number) {
  return prisma.accessLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  })
}

export async function getOrganizationLinks(organizationId: number) {
  return prisma.accessLink.findMany({
    where: { organizationId },
    include: { subdivision: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getActiveOrgLink(organizationId: number) {
  return prisma.accessLink.findFirst({
    where: {
      organizationId,
      subdivisionId: null,
      ...activeLinkWhere(),
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getActiveSubdivisionLink(subdivisionId: number) {
  return prisma.accessLink.findFirst({
    where: {
      subdivisionId,
      ...activeLinkWhere(),
    },
    orderBy: { createdAt: "desc" },
  })
}
