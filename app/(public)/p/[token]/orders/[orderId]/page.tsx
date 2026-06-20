import { notFound } from "next/navigation"
import { ScopedOrderDetailClient } from "@/components/shared/scoped-orders-clients"
import { scopeFromAccessLink } from "@/lib/dashboard/stats"
import { mapOrderItemsToPublicItems } from "@/lib/public/map-public-items"
import {
  serializePublicOrderDetail,
  serializePublicStatuses,
} from "@/lib/public/serialize-public"
import { getOrderForToken } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; orderId: string }> }

export default async function PublicOrderDetailPage({ params }: Params) {
  const { token, orderId: orderIdParam } = await params
  const orderId = Number(orderIdParam)
  if (!Number.isFinite(orderId)) notFound()

  const [ctx, statuses] = await Promise.all([
    getOrderForToken(token, orderId),
    getWorkflowStatuses(),
  ])
  if (!ctx) notFound()

  const scope = scopeFromAccessLink(ctx.link)
  const items = mapOrderItemsToPublicItems(ctx.order, ctx.order.items)

  return (
    <ScopedOrderDetailClient
      context={{ scope: "public", token }}
      order={serializePublicOrderDetail(ctx.order)}
      items={items}
      statuses={serializePublicStatuses(statuses)}
      showSubdivisionColumn={scope.type === "organization"}
    />
  )
}
