import { notFound } from "next/navigation"
import { PublicOrderPage } from "@/components/public/public-order-page"
import { mapOrderItemsToPublicItems } from "@/lib/public/map-public-items"
import { getOrderForToken } from "@/lib/public/validate-token"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; orderId: string }> }

export default async function PublicOrderDetailPage({ params }: Params) {
  const { token, orderId: orderIdParam } = await params
  const orderId = Number(orderIdParam)
  if (!Number.isFinite(orderId)) notFound()

  const ctx = await getOrderForToken(token, orderId)
  if (!ctx) notFound()

  const statuses = await getWorkflowStatuses()
  const scope = scopeFromAccessLink(ctx.link)
  const items = mapOrderItemsToPublicItems(ctx.order, ctx.order.items)

  return (
    <PublicOrderPage
      token={token}
      order={JSON.parse(
        JSON.stringify({
          id: ctx.order.id,
          title: ctx.order.title,
          issuedAt: ctx.order.issuedAt.toISOString(),
        })
      )}
      items={JSON.parse(JSON.stringify(items))}
      statuses={JSON.parse(JSON.stringify(statuses))}
      showSubdivisionColumn={scope.type === "organization"}
    />
  )
}
