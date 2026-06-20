import { notFound } from "next/navigation"
import { ReportOrderDetailClient } from "@/components/report/report-page-clients"
import { mapOrderItemsToPublicItems } from "@/lib/public/map-public-items"
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
  const publicItems = mapOrderItemsToPublicItems(ctx.order, ctx.order.items)
  const showSubdivisionColumn = publicItems.some((item) => item.subdivisionName)

  const items = publicItems.map((item) => ({
    id: item.id,
    dueAt: item.dueAt,
    measure: { name: item.measure.name, code: item.measure.code },
    status: item.status,
    subdivisionName: item.subdivisionName,
  }))

  return (
    <ReportOrderDetailClient
      token={token}
      order={JSON.parse(
        JSON.stringify({
          id: ctx.order.id,
          title: ctx.order.title,
          issuedAt: ctx.order.issuedAt.toISOString(),
        })
      )}
      organizationName={ctx.order.organization.name}
      items={JSON.parse(JSON.stringify(items))}
      statuses={JSON.parse(JSON.stringify(statuses))}
      showSubdivisionColumn={showSubdivisionColumn}
    />
  )
}
