import { notFound } from "next/navigation"
import { OrderItemBreadcrumbEffect } from "@/components/platform/order-item-breadcrumb-effect"
import { SubmitOrderItemResponseForm } from "@/components/platform/submit-order-item-response-form"
import { PageHeader } from "@/components/shared/page-header"
import { getOrderItemForResponse } from "@/lib/orders"
import { serializeOrderItemResponseContext } from "@/lib/serialize/panel"

type Params = { params: Promise<{ id: string; itemId: string }> }

export default async function NewOrderItemResponsePage({ params }: Params) {
  const { id: orderIdParam, itemId: itemIdParam } = await params
  const orderId = Number(orderIdParam)
  const itemId = Number(itemIdParam)
  if (!Number.isFinite(orderId) || !Number.isFinite(itemId)) notFound()

  const item = await getOrderItemForResponse(orderId, itemId)
  if (!item) notFound()

  const context = serializeOrderItemResponseContext(item)

  return (
    <div className="flex flex-col gap-6">
      <OrderItemBreadcrumbEffect
        orderId={context.orderId}
        orderTitle={context.orderTitle}
        measureName={context.item.measure.name}
        pageLabel="Отправить отчёт"
      />
      <PageHeader
        title="Отправить отчёт"
        description={context.item.measure.name}
        backHref={`/panel/orders/${context.orderId}`}
        backLabel={context.orderTitle}
      />
      <SubmitOrderItemResponseForm orderId={context.orderId} item={context.item} />
    </div>
  )
}
