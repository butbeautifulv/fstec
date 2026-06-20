import { notFound } from "next/navigation"
import { PublicItemDetail } from "@/components/public/public-item-detail"
import { getPublicOrderItem } from "@/lib/public/validate-token"
import { serializePublicStatuses } from "@/lib/public/serialize-public"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function PublicItemPage({ params }: Params) {
  const { token, id } = await params
  const orderItemId = Number(id)

  let ctx
  try {
    const [itemCtx, statuses] = await Promise.all([
      getPublicOrderItem(token, orderItemId),
      getWorkflowStatuses(),
    ])
    ctx = { ...itemCtx, statuses }
  } catch {
    notFound()
  }

  const item = ctx.item
  const latest = item.responses[0]

  return (
    <PublicItemDetail
      token={token}
      organizationName={ctx.organization.name}
      subdivisionName={ctx.subdivision?.name ?? null}
      statuses={serializePublicStatuses(ctx.statuses)}
      orderId={item.order.id}
      latestResponse={
        latest
          ? {
              reviewStatus: latest.reviewStatus,
              reviewNote: latest.reviewNote,
              result: latest.result,
              commentary: latest.commentary,
              submittedAt: latest.submittedAt.toISOString(),
              submittedByLabel: latest.submittedByLabel,
            }
          : null
      }
      item={{
        id: item.id,
        dueAt: item.dueAt.toISOString(),
        measure: {
          name: item.measure.name,
          code: item.measure.code,
          description: item.measure.description,
        },
        status: { id: item.status.id, name: item.status.name },
        orderTitle: item.order.title,
      }}
    />
  )
}
