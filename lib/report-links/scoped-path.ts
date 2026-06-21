import { dashboardBaseHref } from "@/lib/dashboard/build-dashboard-page-props"
import type { DashboardScope } from "@/lib/dashboard/stats"

export function reportSharePath(token: string): string {
  return `/report/${token}`
}

export function reportScopedDashboardPath(token: string, scope: DashboardScope): string {
  return dashboardBaseHref("report", scope, token)
}

export function dashboardScopeForLinkRow(row: {
  kind: "report" | "organization" | "subdivision"
  organizationId?: number
  subdivisionId?: number
}): DashboardScope {
  if (row.kind === "report") return { type: "global" }
  if (row.kind === "organization" && row.organizationId != null) {
    return { type: "organization", organizationId: row.organizationId }
  }
  if (
    row.kind === "subdivision" &&
    row.organizationId != null &&
    row.subdivisionId != null
  ) {
    return {
      type: "subdivision",
      organizationId: row.organizationId,
      subdivisionId: row.subdivisionId,
    }
  }
  return { type: "global" }
}
