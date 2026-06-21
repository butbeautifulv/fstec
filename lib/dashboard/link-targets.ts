import type { DashboardMatrixLinkTargets } from "@/components/dashboard/dashboard-matrix-table"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { DashboardVariant } from "@/lib/dashboard/variant-config"
import { publicShowsSubdivisionColumn } from "@/lib/dashboard/chart-scope"
import type { DashboardScope } from "@/lib/dashboard/stats"
import { isReportScopeAllowed } from "@/lib/report-links/scope"

export type PublicDashboardLinkTargets = {
  basePath: string
  subdivisionHref?: (subdivisionId: number) => string
}

export function dashboardMatrixLinkTargets(
  variant: "platform" | "report",
  token?: string,
  linkScope?: DashboardScope
): DashboardMatrixLinkTargets {
  if (variant === "platform") {
    return {
      organization: (orgId) => `/panel/organizations/${orgId}/dashboard`,
      subdivision: (orgId, subId) =>
        `/panel/organizations/${orgId}/subdivisions/${subId}/dashboard`,
      order: (orderId) => `/panel/orders/${orderId}`,
      measure: (row) => `/panel/measures/${row.measure.id}/edit`,
    }
  }

  if (!token) {
    throw new Error("Report dashboard matrix requires token")
  }

  const scope = linkScope ?? { type: "global" as const }

  return {
    organization: (orgId) => {
      const requested = { type: "organization" as const, organizationId: orgId }
      if (!isReportScopeAllowed(scope, requested)) return "#"
      return `/report/${token}/organizations/${orgId}/dashboard`
    },
    subdivision: (orgId, subId) => {
      const requested = {
        type: "subdivision" as const,
        organizationId: orgId,
        subdivisionId: subId,
      }
      if (!isReportScopeAllowed(scope, requested)) return "#"
      return `/report/${token}/organizations/${orgId}/subdivisions/${subId}/dashboard`
    },
    order: (orderId) => `/report/${token}/orders/${orderId}`,
    measure: (row: DashboardMatrixRow) => `/report/${token}/items/${row.id}`,
  }
}

export function dashboardPublicLinkTargets(
  token: string,
  scope: DashboardScope
): PublicDashboardLinkTargets {
  return {
    basePath: `/p/${token}`,
    subdivisionHref: publicShowsSubdivisionColumn(scope)
      ? (subdivisionId) => `/p/${token}/subdivisions/${subdivisionId}`
      : undefined,
  }
}

export function dashboardLinkTargets(
  variant: DashboardVariant,
  options: { token?: string; scope?: DashboardScope; linkScope?: DashboardScope } = {}
): DashboardMatrixLinkTargets | PublicDashboardLinkTargets {
  if (variant === "public") {
    if (!options.token || !options.scope) {
      throw new Error("Public dashboard link targets require token and scope")
    }
    return dashboardPublicLinkTargets(options.token, options.scope)
  }

  return dashboardMatrixLinkTargets(
    variant,
    options.token,
    options.linkScope
  )
}
