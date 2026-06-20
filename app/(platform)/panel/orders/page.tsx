import { Suspense } from "react"
import { OrdersTable } from "@/components/platform/orders-table"
import { OrdersPageActions } from "@/components/platform/resource-page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { labels } from "@/lib/ui/branding"
import { listOrders } from "@/lib/orders"
import { serializeOrders } from "@/lib/serialize/panel"

async function OrdersTableSection() {
  const orders = await listOrders()
  return <OrdersTable initialOrders={serializeOrders(orders)} />
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Поручения"
        description={`Поручения ${labels.orgPluralGenitive} по исполнению мер`}
        actions={<OrdersPageActions />}
      />

      <Suspense fallback={<TablePageSkeleton />}>
        <OrdersTableSection />
      </Suspense>
    </div>
  )
}
