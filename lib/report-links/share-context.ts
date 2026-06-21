import { Permission, hasPermission } from "@/lib/auth/permissions"
import { getActiveReportLink, getActiveReportLinks } from "@/lib/report-links"
import type { DashboardScope } from "@/lib/dashboard/stats"

export async function getReportShareContext(
  session: { role?: string | null },
  scope: DashboardScope = { type: "global" }
) {
  const activeReportLink = await getActiveReportLink(scope)
  return {
    reportToken: activeReportLink?.token ?? null,
    reportLinkId: activeReportLink?.id ?? null,
    canManageReportLinks: hasPermission(session.role, Permission.settingsWrite),
  }
}

export async function getOrganizationReportTokens(
  organizationId: number,
  subdivisionIds: number[]
) {
  const links = await getActiveReportLinks()
  const orgReportLink = links.find(
    (link) => link.organizationId === organizationId && link.subdivisionId == null
  )
  const subReportTokens: Record<number, string> = {}
  for (const link of links) {
    if (link.subdivisionId != null && subdivisionIds.includes(link.subdivisionId)) {
      subReportTokens[link.subdivisionId] = link.token
    }
  }
  return {
    orgReportToken: orgReportLink?.token ?? null,
    subReportTokens,
  }
}
