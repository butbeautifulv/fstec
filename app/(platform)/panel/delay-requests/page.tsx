import Link from "next/link"
import { DelayRequestsTable } from "@/components/platform/delay-requests-table"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
        description="Централизованный список запросов на продление сроков"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={!statusFilter ? "default" : "outline"} asChild>
              <Link href="/panel/delay-requests">Все</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.PENDING ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/delay-requests?status=PENDING">Ожидают</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.APPROVED ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/delay-requests?status=APPROVED">Одобрены</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === DelayRequestStatus.REJECTED ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/delay-requests?status=REJECTED">Отклонены</Link>
            </Button>
          </div>
        }
      />

      {pendingCount > 0 && statusFilter !== DelayRequestStatus.PENDING && (
        <Alert>
          <AlertTitle>Ожидают решения: {pendingCount}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>Есть заявки на перенос, требующие рассмотрения.</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/panel/delay-requests?status=PENDING">Показать ожидающие</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DelayRequestsTable initialRows={serialized} />
    </div>
  )
}
