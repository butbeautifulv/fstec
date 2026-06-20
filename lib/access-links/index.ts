import { invalidateKeys } from "@/lib/cache/json-cache"
import { prisma } from "@/lib/db"
import { activeLinkWhere } from "@/lib/links/active-where"
import { generateLinkToken } from "@/lib/links/generate-token"

function accessLinkCacheKey(token: string) {
  return `access-link:${token}`
}

async function invalidateAccessLinkTokens(tokens: string[]) {
  if (tokens.length === 0) return
  await invalidateKeys(...tokens.map(accessLinkCacheKey))
}

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
  const activeLinks = await prisma.accessLink.findMany({
    where: {
      organizationId,
      subdivisionId,
      revokedAt: null,
    },
    select: { token: true },
  })

  await prisma.accessLink.updateMany({
    where: {
      organizationId,
      subdivisionId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })

  await invalidateAccessLinkTokens(activeLinks.map((link) => link.token))
}

export async function revokeAccessLink(linkId: number) {
  const link = await prisma.accessLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  })
  await invalidateAccessLinkTokens([link.token])
  return link
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
