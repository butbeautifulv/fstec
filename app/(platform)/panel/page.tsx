import { AdminDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
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

  return (
    <AdminDashboardPageShell
      title={`Сводка по ${labels.orgPluralGenitive}`}
      description="Статусы исполнения мер по поручениям"
      baseHref="/panel"
      overdueOnly={overdueOnly}
      stats={JSON.parse(JSON.stringify(stats))}
      items={JSON.parse(JSON.stringify(matrixItems))}
      emptyMessage={
        <>Нет данных. Создайте поручение для {labels.orgGenitive} в разделе «Поручения».</>
      }
    />
  )
}
