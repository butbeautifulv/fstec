import Link from "next/link"
import { ResponsesTableSuspense } from "@/components/platform/responses-table-section"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { countPendingResponses } from "@/lib/responses"
import { ResponseReviewStatus } from "@prisma/client"

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter =
    params.status === "ACCEPTED" ||
    params.status === "REJECTED" ||
    params.status === "PENDING"
      ? (params.status as ResponseReviewStatus)
      : undefined

  const pendingCount = await countPendingResponses()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Отчёты"
        description="Централизованный список отчётов о выполнении мер"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={!statusFilter ? "default" : "outline"} asChild>
              <Link href="/panel/responses">Все</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === ResponseReviewStatus.PENDING ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/responses?status=PENDING">Ожидают</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === ResponseReviewStatus.ACCEPTED ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/responses?status=ACCEPTED">Приняты</Link>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === ResponseReviewStatus.REJECTED ? "default" : "outline"}
              asChild
            >
              <Link href="/panel/responses?status=REJECTED">Не приняты</Link>
            </Button>
          </div>
        }
      />

      {pendingCount > 0 && statusFilter !== ResponseReviewStatus.PENDING && (
        <Alert>
          <AlertTitle>Ожидают проверки: {pendingCount}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>Есть отчёты, требующие рассмотрения.</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/panel/responses?status=PENDING">Показать ожидающие</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ResponsesTableSuspense statusFilter={statusFilter} />
    </div>
  )
}
