import type { ReactNode } from "react"
import type { ScopedDashboardPageShellProps } from "@/components/dashboard/dashboard-page-shell"
import type { DashboardVariant } from "@/lib/dashboard/variant-config"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { PublicStatus } from "@/lib/public/types"

type BuildDashboardPagePropsInput = {
  variant: DashboardVariant
  scope: DashboardScope
  title: string
  description: string
  overdueOnly: boolean
  emptyMessage: ReactNode
  token?: string
  linkScope?: DashboardScope
  statuses?: PublicStatus[]
  headerActions?: ReactNode
  extraActions?: ReactNode
  suspenseCharts?: boolean
  itemLimit?: number
  beforeContent?: ReactNode
  breadcrumbEffect?: ReactNode
}

export function dashboardBaseHref(
  variant: DashboardVariant,
  scope: DashboardScope,
  token?: string
): string {
  if (variant === "platform") {
    if (scope.type === "global") return "/panel"
    if (scope.type === "organization") {
      return `/panel/organizations/${scope.organizationId}/dashboard`
    }
    return `/panel/organizations/${scope.organizationId}/subdivisions/${scope.subdivisionId}/dashboard`
  }

  if (variant === "report") {
    if (!token) throw new Error("Report dashboard requires token")
    if (scope.type === "global") return `/report/${token}`
    if (scope.type === "organization") {
      return `/report/${token}/organizations/${scope.organizationId}/dashboard`
    }
    return `/report/${token}/organizations/${scope.organizationId}/subdivisions/${scope.subdivisionId}/dashboard`
  }

  if (!token) throw new Error("Public dashboard requires token")
  if (scope.type === "subdivision") {
    return `/p/${token}/subdivisions/${scope.subdivisionId}`
  }
  return `/p/${token}`
}

export function buildDashboardPageProps(
  input: BuildDashboardPagePropsInput
): ScopedDashboardPageShellProps {
  const baseHref = dashboardBaseHref(input.variant, input.scope, input.token)
  const shared = {
    scope: input.scope,
    title: input.title,
    description: input.description,
    baseHref,
    overdueOnly: input.overdueOnly,
    emptyMessage: input.emptyMessage,
    headerActions: input.headerActions,
    extraActions: input.extraActions,
    suspenseCharts: input.suspenseCharts,
    itemLimit: input.itemLimit,
    beforeContent: input.beforeContent,
    breadcrumbEffect: input.breadcrumbEffect,
  }

  if (input.variant === "platform") {
    return { variant: "platform", ...shared }
  }

  if (input.variant === "report") {
    if (!input.token) throw new Error("Report dashboard requires token")
    return {
      variant: "report",
      token: input.token,
      linkScope: input.linkScope ?? input.scope,
      ...shared,
    }
  }

  if (!input.token || !input.statuses) {
    throw new Error("Public dashboard requires token and statuses")
  }

  return {
    variant: "public",
    token: input.token,
    statuses: input.statuses,
    ...shared,
  }
}
