import { notFound } from "next/navigation"
import { OrderItemDelaysClient } from "@/components/platform/order-item-delays-client"
import { getOrderItemDelayRequests } from "@/lib/orders"
import { serializeOrderItemDelaysContext } from "@/lib/serialize/panel"

type Params = { params: Promise<{ id: string; itemId: string }> }

export default async function OrderItemDelaysPage({ params }: Params) {
  const { id: orderIdParam, itemId: itemIdParam } = await params
  const orderId = Number(orderIdParam)
  const itemId = Number(itemIdParam)
  if (!Number.isFinite(orderId) || !Number.isFinite(itemId)) notFound()

  const item = await getOrderItemDelayRequests(orderId, itemId)
  if (!item) notFound()

  const context = serializeOrderItemDelaysContext(item)

  return (
    <OrderItemDelaysClient
      orderId={context.orderId}
      orderTitle={context.orderTitle}
      measureName={context.measureName}
      delayRequests={context.delayRequests}
    />
  )
}
