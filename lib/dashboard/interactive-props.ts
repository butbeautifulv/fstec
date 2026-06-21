import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { ScopedDashboardStats, DashboardScope } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import {
  getDashboardVariantConfig,
  type DashboardVariant,
} from "@/lib/dashboard/variant-config"

type InteractiveBase = {
  stats: ScopedDashboardStats
  overdueOnly: boolean
  dashboardScope: DashboardScope
}

type PlatformInteractiveProps = InteractiveBase & {
  variant: "platform"
  scope: ChartFilterScope
  items: DashboardMatrixRow[]
}

type PublicInteractiveProps = InteractiveBase & {
  variant: "public"
  scope: ChartFilterScope
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
}

type ReportInteractiveProps = InteractiveBase & {
  variant: "report"
  scope: ChartFilterScope
  token: string
  linkScope: DashboardScope
  items: DashboardMatrixRow[]
}

export type DashboardInteractiveProps =
  | PlatformInteractiveProps
  | PublicInteractiveProps
  | ReportInteractiveProps

type ShellVariantProps =
  | {
      variant: "platform"
      scope?: ChartFilterScope
      items: DashboardMatrixRow[]
      dashboardScope: DashboardScope
    }
  | {
      variant: "report"
      token: string
      linkScope: DashboardScope
      scope?: ChartFilterScope
      items: DashboardMatrixRow[]
      dashboardScope: DashboardScope
    }
  | {
      variant: "public"
      token: string
      items: PublicItem[]
      statuses: PublicStatus[]
      scope: ChartFilterScope
      showSubdivisionColumn: boolean
      dashboardScope: DashboardScope
    }

export function toDashboardInteractiveProps(
  props: ShellVariantProps,
  stats: ScopedDashboardStats,
  overdueOnly: boolean
): DashboardInteractiveProps {
  const config = getDashboardVariantConfig(props.variant)
  const base = { stats, overdueOnly, dashboardScope: props.dashboardScope }

  if (props.variant === "platform") {
    return {
      ...base,
      variant: "platform",
      scope: props.scope ?? config.defaultScope,
      items: props.items,
    }
  }

  if (props.variant === "report") {
    return {
      ...base,
      variant: "report",
      scope: props.scope ?? config.defaultScope,
      token: props.token,
      linkScope: props.linkScope,
      items: props.items,
    }
  }

  return {
    ...base,
    variant: "public",
    scope: props.scope,
    token: props.token,
    items: props.items,
    statuses: props.statuses,
    showSubdivisionColumn: props.showSubdivisionColumn,
  }
}

export function dashboardShowsEmptyInteractive(
  variant: DashboardVariant,
  itemCount: number
): boolean {
  return variant === "public" || itemCount > 0
}

export type { DashboardVariant }
