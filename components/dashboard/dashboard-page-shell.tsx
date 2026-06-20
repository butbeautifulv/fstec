import Link from "next/link"
import type { ReactNode } from "react"
import { DashboardInteractive } from "@/components/dashboard/dashboard-interactive"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import type { ChartFilterScope } from "@/lib/dashboard/chart-filters"

type MatrixItem = {
  id: number
  orderId: number
  dueAt: string
  isOverdue: boolean
  measure: { id: number; name: string }
  order: { title: string; organization: { id: number; name: string } }
  status: { name: string; isTerminal: boolean }
}

type AdminDashboardPageShellProps = {
  title: string
  description: string
  baseHref: string
  overdueOnly: boolean
  stats: ScopedDashboardStats
  items: MatrixItem[]
  emptyMessage: ReactNode
}

export function AdminDashboardPageShell({
  title,
  description,
  baseHref,
  overdueOnly,
  stats,
  items,
  emptyMessage,
}: AdminDashboardPageShellProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant={overdueOnly ? "outline" : "default"} asChild>
              <Link href={baseHref}>Все</Link>
            </Button>
            <Button size="sm" variant={overdueOnly ? "default" : "outline"} asChild>
              <Link href={`${baseHref}?overdue=1`}>Просроченные</Link>
            </Button>
          </div>
        }
      />

      {items.length === 0 && (
        <Alert>
          <AlertDescription>{emptyMessage}</AlertDescription>
        </Alert>
      )}

      {items.length > 0 && (
        <DashboardInteractive
          key={overdueOnly ? "overdue" : "all"}
          variant="admin"
          scope="global"
          stats={stats}
          items={items}
          overdueOnly={overdueOnly}
        />
      )}
    </div>
  )
}

export type { MatrixItem, ChartFilterScope }
