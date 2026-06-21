import { Suspense } from "react"
import { OrdersTable } from "@/components/platform/orders-table"
import { OrdersPageActions } from "@/components/platform/resource-page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { TableOnlySkeleton } from "@/components/shared/skeletons/table-only-skeleton"
import { Badge } from "@/components/ui/badge"
import { labels } from "@/lib/ui/branding"
import { parseOptionalIntParam } from "@/lib/api/route-handler"
import { listOrders } from "@/lib/orders"
import { serializeOrders } from "@/lib/serialize/panel"

async function OrdersTableSection({
  sourceImportId,
}: {
  sourceImportId?: number
}) {
  const orders = await listOrders(
    sourceImportId != null ? { sourceImportId } : undefined
  )
  return (
    <OrdersTable initialOrders={serializeOrders(orders)} />
  )
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceImportId?: string }>
}) {
  const { sourceImportId: sourceImportIdRaw } = await searchParams
  const sourceImportId = parseOptionalIntParam(sourceImportIdRaw)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Поручения"
        description={`Поручения ${labels.orgPluralGenitive} по исполнению мер`}
        actions={<OrdersPageActions />}
      />
      {sourceImportId != null && (
        <Badge variant="secondary" className="w-fit">
          Фильтр по импорту #{sourceImportId}
        </Badge>
      )}

      <Suspense fallback={<TableOnlySkeleton />}>
        <OrdersTableSection sourceImportId={sourceImportId} />
      </Suspense>
    </div>
  )
}
