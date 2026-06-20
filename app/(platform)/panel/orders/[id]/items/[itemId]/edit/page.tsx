import { notFound } from "next/navigation"
import { OrderItemBreadcrumbEffect } from "@/components/platform/order-item-breadcrumb-effect"
import { OrderItemEditForm } from "@/components/platform/order-item-edit-form"
import { PageHeader } from "@/components/shared/page-header"
import { getOrderItemContext } from "@/lib/orders"
import {
  serializeOrderItemEditContext,
  serializeStatuses,
} from "@/lib/serialize/panel"
import { listSelectableStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ id: string; itemId: string }> }

export default async function EditOrderItemPage({ params }: Params) {
  const { id: orderIdParam, itemId: itemIdParam } = await params
  const orderId = Number(orderIdParam)
  const itemId = Number(itemIdParam)
  if (!Number.isFinite(orderId) || !Number.isFinite(itemId)) notFound()

  const [item, statuses] = await Promise.all([
    getOrderItemContext(orderId, itemId),
    listSelectableStatuses(),
  ])
  if (!item) notFound()

  const context = serializeOrderItemEditContext(item)

  return (
    <div className="flex flex-col gap-6">
      <OrderItemBreadcrumbEffect
        orderId={context.orderId}
        orderTitle={context.orderTitle}
        measureName={context.item.measure.name}
        pageLabel="Редактирование"
      />
      <PageHeader
        title="Редактирование позиции"
        description={context.item.measure.name}
        backHref={`/panel/orders/${context.orderId}`}
        backLabel={context.orderTitle}
      />
      <OrderItemEditForm
        orderId={context.orderId}
        item={context.item}
        statuses={serializeStatuses(statuses)}
        subdivisions={context.subdivisions}
      />
    </div>
  )
}
