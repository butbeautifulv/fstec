import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import {
  getDashboardVariantConfig,
  type DashboardVariant,
} from "@/lib/dashboard/variant-config"

type PlatformInteractiveProps = {
  variant: "platform"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
  overdueOnly: boolean
}

type PublicInteractiveProps = {
  variant: "public"
  scope: "organization" | "subdivision"
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
  overdueOnly: boolean
}

type ReportInteractiveProps = {
  variant: "report"
  scope: "global"
  stats: ScopedDashboardStats
  token: string
  items: DashboardMatrixRow[]
  overdueOnly: boolean
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
    }
  | {
      variant: "report"
      token: string
      items: DashboardMatrixRow[]
    }
  | {
      variant: "public"
      token: string
      items: PublicItem[]
      statuses: PublicStatus[]
      scope: "organization" | "subdivision"
      showSubdivisionColumn: boolean
    }

export function toDashboardInteractiveProps(
  props: ShellVariantProps,
  stats: ScopedDashboardStats,
  overdueOnly: boolean
): DashboardInteractiveProps {
  const config = getDashboardVariantConfig(props.variant)

  if (props.variant === "platform") {
    return {
      variant: "platform",
      scope: props.scope ?? config.defaultScope,
      stats,
      items: props.items,
      overdueOnly,
    }
  }

  if (props.variant === "report") {
    return {
      variant: "report",
      scope: "global",
      stats,
      token: props.token,
      items: props.items,
      overdueOnly,
    }
  }

  return {
    variant: "public",
    scope: props.scope,
    stats,
    token: props.token,
    items: props.items,
    statuses: props.statuses,
    showSubdivisionColumn: props.showSubdivisionColumn,
    overdueOnly,
  }
}

export function dashboardShowsEmptyInteractive(
  variant: DashboardVariant,
  itemCount: number
): boolean {
  return variant === "public" || itemCount > 0
}

export type { DashboardVariant }
