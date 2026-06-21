import { prisma } from "@/lib/db"
import { activeLinkWhere } from "@/lib/links/active-where"
import { generateLinkToken } from "@/lib/links/generate-token"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import type { DashboardScope } from "@/lib/dashboard/stats"
import {
  reportLinkCreateData,
  reportLinkScopeWhere,
} from "@/lib/report-links/scope"

async function revokeActiveReportLinksForScope(scope: DashboardScope) {
  await prisma.reportLink.updateMany({
    where: {
      ...reportLinkScopeWhere(scope),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

export async function createReportLink(scope: DashboardScope = { type: "global" }) {
  await revokeActiveReportLinksForScope(scope)
  return prisma.reportLink.create({
    data: {
      token: generateLinkToken(),
      ...reportLinkCreateData(scope),
    },
  })
}

export async function revokeReportLink(linkId: number) {
  return prisma.reportLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  })
}

export async function getActiveReportLink(scope: DashboardScope = { type: "global" }) {
  const links = await prisma.reportLink.findMany({
    where: {
      ...reportLinkScopeWhere(scope),
      ...activeLinkWhere(),
    },
    orderBy: { createdAt: "desc" },
  })
  return links.find(isRevocableLinkActive) ?? null
}

export async function getActiveReportLinks() {
  const links = await prisma.reportLink.findMany({
    where: activeLinkWhere(),
    orderBy: { createdAt: "desc" },
  })
  return links.filter(isRevocableLinkActive)
}

export async function listReportLinks() {
  return prisma.reportLink.findMany({
    orderBy: { createdAt: "desc" },
  })
}
