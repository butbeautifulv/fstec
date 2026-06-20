import { notFound } from "next/navigation"
import { ReportItemDetail } from "@/components/report/report-item-detail"
import { getOrderItemForReportToken } from "@/lib/report-links/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function ReportItemPage({ params }: Params) {
  const { token, id } = await params
  const orderItemId = Number(id)

  let ctx
  try {
    ctx = await getOrderItemForReportToken(token, orderItemId)
  } catch {
    notFound()
  }

  const statuses = await getWorkflowStatuses()
  const statusMeta = statuses.find((s) => s.id === ctx.item.status.id)

  const item = ctx.item
  const latestResponse = item.responses[0]

  return (
    <ReportItemDetail
      token={token}
      item={{
        id: item.id,
        dueAt: item.dueAt.toISOString(),
        measure: {
          name: item.measure.name,
          code: item.measure.code,
          description: item.measure.description,
        },
        status: {
          id: item.status.id,
          name: item.status.name,
          isTerminal: statusMeta?.isTerminal ?? item.status.name === "Выполнено",
        },
        orderId: item.orderId,
        orderTitle: item.order.title,
        organizationName: item.order.organization.name,
        subdivisionName: item.subdivision?.name ?? null,
        latestResponse: latestResponse
          ? {
              reviewStatus: latestResponse.reviewStatus,
              result: latestResponse.result,
              commentary: latestResponse.commentary,
              submittedAt: latestResponse.submittedAt.toISOString(),
              submittedByLabel: latestResponse.submittedByLabel,
              attachments: latestResponse.attachments.map((a) => ({
                id: a.id,
                originalName: a.originalName,
              })),
            }
          : null,
      }}
    />
  )
}
