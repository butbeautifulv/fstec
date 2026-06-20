import { OrdersTable } from "@/components/platform/orders-table"
import { OrdersPageActions } from "@/components/platform/resource-page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { labels } from "@/lib/ui/branding"
import { listOrders } from "@/lib/orders"

export default async function OrdersPage() {
  const orders = await listOrders()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Поручения"
        description={`Поручения ${labels.orgPluralGenitive} по исполнению мер`}
        actions={<OrdersPageActions />}
      />

      <OrdersTable initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  )
}
