"use client"

import { ResponseReviewStatus } from "@prisma/client"
import { ItemDetailHeaderActions } from "@/components/shared/item-detail/item-detail-header-actions"
import { ItemDueStatusCard } from "@/components/shared/item-detail/item-due-status-card"
import { ItemMeasureInfoCard } from "@/components/shared/item-detail/item-measure-info-card"
import { ItemResponseCard } from "@/components/shared/item-detail/item-response-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  getDisplayStatusName,
  isCompleted,
  isOrderItemOverdue,
} from "@/lib/statuses/workflow"
import { getItemDetailStatusVariant } from "@/lib/ui/item-detail-status"

type ReportItem = {
  id: number
  dueAt: string
  measure: { name: string; code: string | null; description: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderId: number
  orderTitle: string
  organizationName: string
  subdivisionName: string | null
  latestResponse: {
    reviewStatus: ResponseReviewStatus
    result: string
    commentary: string | null
    submittedAt: string
    submittedByLabel: string | null
    attachments: { id: number; originalName: string }[]
  } | null
}

export function ReportItemDetail({
  token,
  item,
}: {
  token: string
  item: ReportItem
}) {
  const isOverdue = isOrderItemOverdue(item)
  const isPendingReview = item.latestResponse?.reviewStatus === ResponseReviewStatus.PENDING
  const displayStatus = isPendingReview ? "На проверке" : getDisplayStatusName(item)
  const completed = isCompleted({
    isTerminal: item.status.isTerminal ?? false,
    name: item.status.name,
  })

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={item.measure.name}
        description={`${item.organizationName}${item.subdivisionName ? ` · ${item.subdivisionName}` : ""}`}
        backHref={`/report/${token}`}
        backLabel="Назад к сводке"
        actions={
          <ItemDetailHeaderActions
            code={item.measure.code}
            orderTitle={item.orderTitle}
            orderHref={`/report/${token}/orders/${item.orderId}`}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ItemMeasureInfoCard
          description={item.measure.description}
          organizationName={item.organizationName}
          subdivisionName={item.subdivisionName}
        />

        <ItemDueStatusCard
          dueAt={item.dueAt}
          displayStatus={displayStatus}
          isOverdue={isOverdue}
          statusVariant={getItemDetailStatusVariant({
            isOverdue,
            isPendingReview,
            completed,
          })}
        />
      </div>

      {item.latestResponse && (
        <ItemResponseCard
          result={item.latestResponse.result}
          commentary={item.latestResponse.commentary}
          submittedAt={item.latestResponse.submittedAt}
          submittedByLabel={item.latestResponse.submittedByLabel}
          reviewStatus={item.latestResponse.reviewStatus}
          attachments={item.latestResponse.attachments}
          attachmentViewUrl={(attachmentId) =>
            `/api/report/${token}/attachments/${attachmentId}`
          }
        />
      )}
    </div>
  )
}
