import type { ReactNode } from "react"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"

export function ReportDashboardPage({
  token,
  title,
  description,
  overdueOnly,
  stats,
  items,
  emptyMessage,
}: {
  token: string
  title: string
  description: string
  overdueOnly: boolean
  stats: ScopedDashboardStats
  items: DashboardMatrixRow[]
  emptyMessage: ReactNode
}) {
  return (
    <ScopedDashboardPageShell
      variant="report"
      title={title}
      description={description}
      baseHref={`/report/${token}`}
      overdueOnly={overdueOnly}
      stats={stats}
      items={items}
      token={token}
      emptyMessage={emptyMessage}
    />
  )
}
