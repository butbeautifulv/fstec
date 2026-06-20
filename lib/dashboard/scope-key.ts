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

export function dashboardCacheKey(scope: DashboardScope): string {
  switch (scope.type) {
    case "global":
      return "dashboard:global"
    case "organization":
      return `dashboard:org:${scope.organizationId}`
    case "subdivision":
      return `dashboard:sub:${scope.organizationId}:${scope.subdivisionId}`
  }
}
