"use client"

import { ScopedDashboardCharts } from "@/components/dashboard/scoped-dashboard-charts"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"

/** @deprecated Use ScopedDashboardCharts directly */
export function DashboardCharts({
  statusDistribution,
  overdueByOrganization,
  completionByOrganization,
}: {
  statusDistribution: ScopedDashboardStats["statusDistribution"]
  overdueByOrganization: { org: string; count: number }[]
  completionByOrganization: { org: string; completed: number; active: number }[]
}) {
  return (
    <ScopedDashboardCharts
      scope="global"
      statusDistribution={statusDistribution}
      overdueBreakdown={overdueByOrganization.map((r) => ({
        label: r.org,
        count: r.count,
      }))}
      completionBreakdown={completionByOrganization.map((r) => ({
        label: r.org,
        completed: r.completed,
        active: r.active,
      }))}
      overdueTitle="Просроченные по организациям"
      completionTitle="Выполнение по организациям"
    />
  )
}
