import Link from "next/link"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { PageHeader } from "@/components/admin/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/ui/branding"
import { getScopedDashboardStats } from "@/lib/dashboard/stats"
import { getScopedDashboardMatrix } from "@/lib/orders"

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>
}) {
  const params = await searchParams
  const overdueOnly = params.overdue === "1"
  const [stats, matrixItems] = await Promise.all([
    getScopedDashboardStats({ type: "global" }),
    getScopedDashboardMatrix({ type: "global" }),
  ])

  const serialized = JSON.parse(JSON.stringify(matrixItems))

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={`Сводка по ${labels.orgPluralGenitive}`}
        description="Статусы исполнения мер по поручениям"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant={overdueOnly ? "outline" : "default"} asChild>
              <Link href="/admin">Все</Link>
            </Button>
            <Button size="sm" variant={overdueOnly ? "default" : "outline"} asChild>
              <Link href="/admin?overdue=1">Просроченные</Link>
            </Button>
          </div>
        }
      />

      <DashboardStatCards stats={stats} />

      {matrixItems.length === 0 && (
        <Alert>
          <AlertDescription>
            Нет данных. Создайте поручение для {labels.orgGenitive} в разделе «Поручения».
          </AlertDescription>
        </Alert>
      )}

      {matrixItems.length > 0 && (
        <ScopedDashboardView
          key={overdueOnly ? "overdue" : "all"}
          variant="admin"
          scope="global"
          stats={JSON.parse(JSON.stringify(stats))}
          items={serialized}
          overdueOnly={overdueOnly}
        />
      )}
    </div>
  )
}
