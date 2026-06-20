import { notFound } from "next/navigation"
import { PublicItemDetail } from "@/components/public/public-item-detail"
import { getOrderItemForToken } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function PublicItemPage({ params }: Params) {
  const { token, id } = await params
  const orderItemId = Number(id)

  let ctx
  try {
    ctx = await getOrderItemForToken(token, orderItemId)
  } catch {
    notFound()
  }

  const statuses = await getWorkflowStatuses()

  const item = ctx.item
  const order = ctx.orders.find((o) => o.items.some((i) => i.id === item.id))

  return (
    <PublicItemDetail
      token={token}
      organizationName={ctx.link.organization.name}
      subdivisionName={ctx.link.subdivision?.name ?? null}
      statuses={statuses}
      orderId={order?.id ?? item.orderId}
      item={{
        id: item.id,
        dueAt: item.dueAt.toISOString(),
        measure: {
          name: item.measure.name,
          code: item.measure.code,
          description: item.measure.description,
        },
        status: { id: item.status.id, name: item.status.name },
        orderTitle: order?.title ?? "Поручение",
      }}
    />
  )
}
