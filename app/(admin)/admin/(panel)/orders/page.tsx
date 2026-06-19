import Link from "next/link"
import { OrdersTable } from "@/components/admin/orders-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/ui/branding"
import { listOrders } from "@/lib/orders"

export default async function OrdersPage() {
  const orders = await listOrders()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Поручения"
        description={`Поручения ${labels.orgPluralGenitive} по исполнению мер`}
        actions={
          <Button asChild>
            <Link href="/admin/orders/new">Создать поручение</Link>
          </Button>
        }
      />

      <OrdersTable initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  )
}
