import { prisma } from "@/lib/db"
import { activeLinkWhere } from "@/lib/links/active-where"
import { isRevocableLinkActive } from "@/lib/links/is-active"
import {
  organizationLinkScopeKey,
  subdivisionLinkScopeKey,
  type LinkScopeActiveLink,
  type LinkScopeRow,
} from "@/lib/public-links/types"
import { getActiveReportLinks } from "@/lib/report-links"
import { reportSharePath } from "@/lib/report-links/scoped-path"
import { scopeKeyFromReportLink } from "@/lib/report-links/scope"

function serializeAccessLink(
  link: { id: number; token: string; createdAt: Date },
  path: string
): LinkScopeActiveLink {
  return {
    id: link.id,
    token: link.token,
    createdAt: link.createdAt.toISOString(),
    path,
  }
}

export async function listPublicLinkScopes(): Promise<LinkScopeRow[]> {
  const [organizations, accessLinks, reportLinks] = await Promise.all([
    prisma.organization.findMany({
      include: {
        subdivisions: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.accessLink.findMany({
      where: activeLinkWhere(),
      include: { subdivision: true },
    }),
    getActiveReportLinks(),
  ])

  const activeOrgLinks = new Map<number, (typeof accessLinks)[number]>()
  const activeSubLinks = new Map<number, (typeof accessLinks)[number]>()
  const activeReportLinks = new Map<string, (typeof reportLinks)[number]>()

  for (const link of accessLinks) {
    if (!isRevocableLinkActive(link)) continue
    if (link.subdivisionId == null) {
      activeOrgLinks.set(link.organizationId, link)
    } else {
      activeSubLinks.set(link.subdivisionId, link)
    }
  }

  for (const link of reportLinks) {
    activeReportLinks.set(scopeKeyFromReportLink(link), link)
  }

  function withReportLink(row: LinkScopeRow): LinkScopeRow {
    const reportLink = activeReportLinks.get(row.key)
    if (!reportLink) return row
    return {
      ...row,
      reportPath: reportSharePath(reportLink.token),
    }
  }

  const globalReportLink = activeReportLinks.get("report")

  const rows: LinkScopeRow[] = [
    withReportLink({
      key: "report",
      kind: "report",
      status: globalReportLink ? "active" : "missing",
      activeLink: globalReportLink
        ? serializeAccessLink(globalReportLink, reportSharePath(globalReportLink.token))
        : undefined,
    }),
  ]

  for (const org of organizations) {
    const orgLink = activeOrgLinks.get(org.id)
    rows.push(
      withReportLink({
        key: organizationLinkScopeKey(org.id),
        kind: "organization",
        organizationId: org.id,
        organizationName: org.name,
        status: orgLink ? "active" : "missing",
        activeLink: orgLink
          ? serializeAccessLink(orgLink, `/p/${orgLink.token}`)
          : undefined,
      })
    )

    for (const subdivision of org.subdivisions) {
      const subLink = activeSubLinks.get(subdivision.id)
      rows.push(
        withReportLink({
          key: subdivisionLinkScopeKey(subdivision.id),
          kind: "subdivision",
          organizationId: org.id,
          organizationName: org.name,
          subdivisionId: subdivision.id,
          subdivisionName: subdivision.name,
          status: subLink ? "active" : "missing",
          activeLink: subLink
            ? serializeAccessLink(subLink, `/p/${subLink.token}`)
            : undefined,
        })
      )
    }
  }

  return rows
}
