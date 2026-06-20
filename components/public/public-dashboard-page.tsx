import Link from "next/link"
import { PublicDashboardInteractive } from "@/components/public/public-dashboard-interactive"
import { PageHeader } from "@/components/admin/page-header"
import {
  type PublicItem,
  type PublicStatus,
} from "@/components/public/public-measures-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={organizationName}
        description={
          subdivisionName ? `Подразделение: ${subdivisionName}` : "Все меры организации"
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{items.length} мер</Badge>
            <Button size="sm" variant={overdueOnly ? "outline" : "default"} asChild>
              <Link href={`/p/${token}`}>Все</Link>
            </Button>
            <Button size="sm" variant={overdueOnly ? "default" : "outline"} asChild>
              <Link href={`/p/${token}?overdue=1`}>Просроченные</Link>
            </Button>
          </div>
        }
      />

      {items.length === 0 && (
        <Alert>
          <AlertDescription>Нет мер для отображения.</AlertDescription>
        </Alert>
      )}

      <PublicDashboardInteractive
        key={overdueOnly ? "overdue" : "all"}
        scope={scope}
        stats={stats}
        token={token}
        items={items}
        statuses={statuses}
        showSubdivisionColumn={showSubdivisionColumn}
        overdueOnly={overdueOnly}
      />
    </div>
  )
}
