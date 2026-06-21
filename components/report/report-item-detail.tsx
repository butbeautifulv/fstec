"use client"

import { ResponseReviewStatus } from "@prisma/client"
import { ItemDetailOverview } from "@/components/shared/item-detail/item-detail-overview"
import { ItemReportWorkflowCard } from "@/components/shared/item-detail/item-report-workflow-card"
import { getItemDetailDisplayState } from "@/lib/ui/item-detail-display"

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
  const {
    isOverdue,
    completed,
    isPendingReview,
    isRejected,
    canSubmitReport,
    displayStatus,
    workflowStatusName,
    reportStatusLabel,
    statusVariant,
  } = getItemDetailDisplayState(item, item.latestResponse)

  return (
    <ItemDetailOverview
      title={item.measure.name}
      description={`${item.organizationName}${item.subdivisionName ? ` · ${item.subdivisionName}` : ""}`}
      backHref={`/report/${token}`}
      backLabel="Назад к сводке"
      measureCode={item.measure.code}
      orderTitle={item.orderTitle}
      orderHref={`/report/${token}/orders/${item.orderId}`}
      measureDescription={item.measure.description}
      organizationName={item.organizationName}
      subdivisionName={item.subdivisionName}
      dueAt={item.dueAt}
      displayStatus={displayStatus}
      workflowStatusName={workflowStatusName}
      reportStatusLabel={reportStatusLabel}
      isOverdue={isOverdue}
      statusVariant={statusVariant}
    >
      {item.latestResponse && (
        <ItemReportWorkflowCard
          completed={completed}
          isPendingReview={isPendingReview}
          isRejected={isRejected}
          canSubmitReport={canSubmitReport}
          latestResponse={item.latestResponse}
          attachmentViewUrl={(attachmentId) =>
            `/api/report/${token}/attachments/${attachmentId}`
          }
        />
      )}
    </ItemDetailOverview>
  )
}
