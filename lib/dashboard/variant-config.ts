import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"

export type DashboardVariant = "platform" | "public" | "report"

export type DashboardTableKind = "matrix" | "measures"

export type DashboardVariantConfig = {
  variant: DashboardVariant
  tableKind: DashboardTableKind
  needsStatuses: boolean
  needsToken: boolean
  defaultScope: ChartFilterScope
  suspenseChartsDefault: boolean
}

const VARIANT_CONFIG: Record<
  DashboardVariant,
  Omit<DashboardVariantConfig, "variant">
> = {
  platform: {
    tableKind: "matrix",
    needsStatuses: false,
    needsToken: false,
    defaultScope: "global",
    suspenseChartsDefault: true,
  },
  public: {
    tableKind: "measures",
    needsStatuses: true,
    needsToken: true,
    defaultScope: "organization",
    suspenseChartsDefault: true,
  },
  report: {
    tableKind: "matrix",
    needsStatuses: false,
    needsToken: true,
    defaultScope: "global",
    suspenseChartsDefault: true,
  },
}

export function getDashboardVariantConfig(
  variant: DashboardVariant
): DashboardVariantConfig {
  return { variant, ...VARIANT_CONFIG[variant] }
}
