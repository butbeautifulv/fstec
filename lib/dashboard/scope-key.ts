import type { DashboardScope } from "@/lib/dashboard/stats"

function formatDatePart(date: Date | undefined): string {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export function serializeDashboardScope(scope: DashboardScope): string {
  const from = formatDatePart(scope.issuedFrom)
  const to = formatDatePart(scope.issuedTo)
  const dateSuffix = from || to ? `|${from}|${to}` : ""

  switch (scope.type) {
    case "global":
      return `global${dateSuffix}`
    case "organization":
      return `organization:${scope.organizationId}${dateSuffix}`
    case "subdivision":
      return `subdivision:${scope.organizationId}:${scope.subdivisionId}${dateSuffix}`
  }
}

export function deserializeDashboardScope(scopeKey: string): DashboardScope {
  const [base, fromRaw, toRaw] = scopeKey.split("|")
  const issuedFrom = fromRaw ? new Date(`${fromRaw}T00:00:00.000Z`) : undefined
  const issuedTo = toRaw ? new Date(`${toRaw}T23:59:59.999Z`) : undefined
  const dateRange =
    issuedFrom || issuedTo ? { issuedFrom, issuedTo } : {}

  if (base === "global") return { type: "global", ...dateRange }
  if (base!.startsWith("organization:")) {
    return {
      type: "organization",
      organizationId: Number(base!.slice("organization:".length)),
      ...dateRange,
    }
  }
  if (base!.startsWith("subdivision:")) {
    const [, organizationId, subdivisionId] = base!.split(":")
    return {
      type: "subdivision",
      organizationId: Number(organizationId),
      subdivisionId: Number(subdivisionId),
      ...dateRange,
    }
  }
  return { type: "global" }
}

export function dashboardCacheKey(scope: DashboardScope): string {
  return `dashboard:${serializeDashboardScope(scope)}`
}
