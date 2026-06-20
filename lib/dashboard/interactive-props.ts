import type { PublicItem, PublicStatus } from "@/lib/public/types"
import type { DashboardMatrixQuery } from "@/lib/dashboard/dashboard-query"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"
import {
  getDashboardVariantConfig,
  type DashboardVariant,
} from "@/lib/dashboard/variant-config"

type DashboardInteractiveBase = {
  baseHref: string
  matrixQuery: DashboardMatrixQuery
}

type PlatformInteractiveProps = DashboardInteractiveBase & {
  variant: "platform"
  scope: ChartFilterScope
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
}

type PublicInteractiveProps = DashboardInteractiveBase & {
  variant: "public"
  scope: "organization" | "subdivision"
  stats: ScopedDashboardStats
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
}

type ReportInteractiveProps = DashboardInteractiveBase & {
  variant: "report"
  scope: "global"
  stats: ScopedDashboardStats
  token: string
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
  context: {
    baseHref: string
    matrixQuery: DashboardMatrixQuery
  }
): DashboardInteractiveProps {
  const config = getDashboardVariantConfig(props.variant)
  const shared = {
    baseHref: context.baseHref,
    matrixQuery: context.matrixQuery,
  }

  if (props.variant === "platform") {
    return {
      variant: "platform",
      scope: props.scope ?? config.defaultScope,
      stats,
      items: props.items,
      ...shared,
    }
  }

  if (props.variant === "report") {
    return {
      variant: "report",
      scope: "global",
      stats,
      token: props.token,
      items: props.items,
      ...shared,
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
    ...shared,
  }
}

export function dashboardShowsEmptyInteractive(
  variant: DashboardVariant,
  itemCount: number,
  statsTotal: number
): boolean {
  if (variant === "public") return true
  return itemCount > 0 || statsTotal > 0
}

export type { DashboardVariant }
