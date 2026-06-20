import { notFound } from "next/navigation"
import { ScopedOrderDetailClient } from "@/components/shared/scoped-orders-clients"
import { mapOrderItemsToPublicItems } from "@/lib/public/map-public-items"
import {
  serializeMeasuresTableItems,
  serializePublicOrderDetail,
  serializePublicStatuses,
} from "@/lib/public/serialize-public"
import { getOrderForReportToken } from "@/lib/report-links/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; orderId: string }> }

export default async function ReportOrderDetailPage({ params }: Params) {
  const { token, orderId: orderIdParam } = await params
  const orderId = Number(orderIdParam)
  if (!Number.isFinite(orderId)) notFound()

  const ctx = await getOrderForReportToken(token, orderId)
  if (!ctx) notFound()

  const statuses = await getWorkflowStatuses()
  const items = mapOrderItemsToPublicItems(ctx.order, ctx.order.items)
  const showSubdivisionColumn = items.some((item) => item.subdivisionName)

  return (
    <ScopedOrderDetailClient
      context={{
        scope: "report",
        token,
        organizationName: ctx.order.organization.name,
      }}
      order={serializePublicOrderDetail(ctx.order)}
      items={serializeMeasuresTableItems(items)}
      statuses={serializePublicStatuses(statuses)}
      showSubdivisionColumn={showSubdivisionColumn}
    />
  )
}
