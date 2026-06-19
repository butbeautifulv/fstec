import Link from "next/link"
import { DelayRequestsTable } from "@/components/admin/delay-requests-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { countPendingDelayRequests, listDelayRequests } from "@/lib/delays"
import { DelayRequestStatus } from "@prisma/client"

export default async function DelayRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter =
    params.status === "APPROVED" || params.status === "REJECTED" || params.status === "PENDING"
      ? (params.status as DelayRequestStatus)
      : undefined

  const [rows, pendingCount] = await Promise.all([
    listDelayRequests(statusFilter),
    countPendingDelayRequests(),
  ])

  const serialized = JSON.parse(JSON.stringify(rows))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Заявки на перенос"
        description={
          pendingCount > 0
            ? `Ожидают решения: ${pendingCount}`
            : "Централизованный список запросов на продление сроков"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={!statusFilter ? "default" : "outline"} asChild>
              <Link href="/admin/delay-requests">Все</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.PENDING ? "default" : "outline"}
              asChild
            >
              <Link href="/admin/delay-requests?status=PENDING">Ожидают</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.APPROVED ? "default" : "outline"}
              asChild
            >
              <Link href="/admin/delay-requests?status=APPROVED">Одобрены</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.REJECTED ? "default" : "outline"}
              asChild
            >
              <Link href="/admin/delay-requests?status=REJECTED">Отклонены</Link>
            </Button>
          </div>
        }
      />

      <DelayRequestsTable initialRows={serialized} />
    </div>
  )
}
