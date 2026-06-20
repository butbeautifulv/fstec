import { prisma } from "@/lib/db"
import { generateLinkToken } from "@/lib/links/generate-token"
import { isRevocableLinkActive } from "@/lib/links/is-active"

export async function createReportLink() {
  await prisma.reportLink.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return prisma.reportLink.create({
    data: { token: generateLinkToken() },
  })
}

export async function revokeReportLink(linkId: number) {
  return prisma.reportLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  })
}

export async function getActiveReportLink() {
  const links = await prisma.reportLink.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return links.find(isRevocableLinkActive) ?? null
}

export async function listReportLinks() {
  return prisma.reportLink.findMany({
    orderBy: { createdAt: "desc" },
  })
}
