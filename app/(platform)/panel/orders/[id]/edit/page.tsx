import { notFound } from "next/navigation"
import { OrderEditBreadcrumbEffect } from "@/components/platform/order-breadcrumb-effect"
import { OrderEditForm } from "@/components/platform/order-edit-form"
import { PageHeader } from "@/components/shared/page-header"
import { getOrderForEdit } from "@/lib/orders"
import { serializeOrderForEdit } from "@/lib/serialize/panel"

type Params = { params: Promise<{ id: string }> }

export default async function EditOrderPage({ params }: Params) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const order = await getOrderForEdit(id)
  if (!order) notFound()

  const serialized = serializeOrderForEdit(order)

  return (
    <div className="flex flex-col gap-6">
      <OrderEditBreadcrumbEffect orderId={serialized.id} orderTitle={serialized.title} />
      <PageHeader
        title="Редактирование поручения"
        description={serialized.title}
        backHref={`/panel/orders/${serialized.id}`}
        backLabel="К поручению"
      />
      <OrderEditForm order={serialized} />
    </div>
  )
}
