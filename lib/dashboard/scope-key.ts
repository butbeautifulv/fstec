import type { DashboardScope } from "@/lib/dashboard/stats"

export function serializeDashboardScope(scope: DashboardScope): string {
  switch (scope.type) {
    case "global":
      return "global"
    case "organization":
      return `organization:${scope.organizationId}`
    case "subdivision":
      return `subdivision:${scope.organizationId}:${scope.subdivisionId}`
  }
}

/** @deprecated Use dashboardStatsCacheKey */
export function dashboardCacheKey(scope: DashboardScope): string {
  return dashboardStatsCacheKey(scope)
}

export function dashboardStatsCacheKey(scope: DashboardScope): string {
  switch (scope.type) {
    case "global":
      return "dashboard:stats:global"
    case "organization":
      return `dashboard:stats:org:${scope.organizationId}`
    case "subdivision":
      return `dashboard:stats:sub:${scope.organizationId}:${scope.subdivisionId}`
  }
}
