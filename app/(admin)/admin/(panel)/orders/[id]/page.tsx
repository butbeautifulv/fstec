import { notFound } from "next/navigation"
import { OrderDetailClient } from "@/components/admin/order-detail-client"
import { getOrder } from "@/lib/orders"
import { listSelectableStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Params) {
  const id = Number((await params).id)
  const [order, statuses] = await Promise.all([getOrder(id), listSelectableStatuses()])
  if (!order) notFound()

  return (
    <OrderDetailClient
      order={JSON.parse(JSON.stringify(order))}
      statuses={JSON.parse(JSON.stringify(statuses))}
    />
  )
}
