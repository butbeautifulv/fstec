import type { Prisma } from "@prisma/client"
import type { DashboardScope } from "@/lib/dashboard/stats"

export type ReportLinkScopeFields = {
  organizationId: number | null
  subdivisionId: number | null
}

export function scopeFromReportLink(link: ReportLinkScopeFields): DashboardScope {
  if (link.organizationId == null && link.subdivisionId == null) {
    return { type: "global" }
  }
  if (link.subdivisionId != null && link.organizationId != null) {
    return {
      type: "subdivision",
      organizationId: link.organizationId,
      subdivisionId: link.subdivisionId,
    }
  }
  if (link.organizationId != null) {
    return { type: "organization", organizationId: link.organizationId }
  }
  return { type: "global" }
}

export function reportLinkScopeWhere(scope: DashboardScope): Prisma.ReportLinkWhereInput {
  if (scope.type === "global") {
    return { organizationId: null, subdivisionId: null }
  }
  if (scope.type === "organization") {
    return {
      organizationId: scope.organizationId,
      subdivisionId: null,
    }
  }
  return {
    organizationId: scope.organizationId,
    subdivisionId: scope.subdivisionId,
  }
}

export function reportLinkCreateData(scope: DashboardScope) {
  if (scope.type === "global") {
    return { organizationId: null, subdivisionId: null }
  }
  if (scope.type === "organization") {
    return {
      organizationId: scope.organizationId,
      subdivisionId: null,
    }
  }
  return {
    organizationId: scope.organizationId,
    subdivisionId: scope.subdivisionId,
  }
}

export function isReportScopeAllowed(
  linkScope: DashboardScope,
  requestedScope: DashboardScope
): boolean {
  if (linkScope.type === "global") return true

  if (linkScope.type === "organization") {
    if (requestedScope.type === "global") return false
    if (requestedScope.type === "organization") {
      return requestedScope.organizationId === linkScope.organizationId
    }
    return requestedScope.organizationId === linkScope.organizationId
  }

  if (requestedScope.type !== "subdivision") return false
  return (
    requestedScope.organizationId === linkScope.organizationId &&
    requestedScope.subdivisionId === linkScope.subdivisionId
  )
}

export function scopeKeyFromReportLink(link: ReportLinkScopeFields): string {
  const scope = scopeFromReportLink(link)
  if (scope.type === "global") return "report"
  if (scope.type === "organization") return `org:${scope.organizationId}`
  return `sub:${scope.subdivisionId}`
}

export function isOrderItemInReportScope(
  linkScope: DashboardScope,
  item: {
    subdivisionId: number | null
    order: { organization: { id: number } }
  }
): boolean {
  if (linkScope.type === "global") return true
  if (linkScope.type === "organization") {
    return item.order.organization.id === linkScope.organizationId
  }
  return (
    item.subdivisionId === linkScope.subdivisionId &&
    item.order.organization.id === linkScope.organizationId
  )
}

export function isOrganizationInReportScope(
  linkScope: DashboardScope,
  organizationId: number
): boolean {
  if (linkScope.type === "global") return true
  if (linkScope.type === "organization") {
    return organizationId === linkScope.organizationId
  }
  return organizationId === linkScope.organizationId
}
