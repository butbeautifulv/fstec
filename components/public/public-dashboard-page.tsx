import { Badge } from "@/components/ui/badge"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import type { PublicItem, PublicStatus } from "@/components/public/public-measures-table"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"

export function PublicDashboardPage({
  token,
  organizationName,
  subdivisionName,
  stats,
  items,
  statuses,
  overdueOnly,
  scope,
  showSubdivisionColumn,
}: {
  token: string
  organizationName: string
  subdivisionName: string | null
  stats: ScopedDashboardStats
  items: PublicItem[]
  statuses: PublicStatus[]
  overdueOnly: boolean
  scope: "organization" | "subdivision"
  showSubdivisionColumn: boolean
}) {
  return (
    <ScopedDashboardPageShell
      variant="public"
      title={organizationName}
      description={
        subdivisionName ? `Подразделение: ${subdivisionName}` : "Все меры организации"
      }
      baseHref={`/p/${token}`}
      overdueOnly={overdueOnly}
      stats={stats}
      items={items}
      statuses={statuses}
      token={token}
      scope={scope}
      showSubdivisionColumn={showSubdivisionColumn}
      emptyMessage="Нет мер для отображения."
      headerActions={<Badge variant="secondary">{items.length} мер</Badge>}
      suspenseCharts={false}
    />
  )
}
