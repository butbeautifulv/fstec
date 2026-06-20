"use client"

import { ResponseReviewStatus } from "@prisma/client"
import { AttachmentGallery } from "@/components/shared/attachment-gallery"
import { ItemDetailHeaderActions } from "@/components/shared/item-detail/item-detail-header-actions"
import { ItemDueStatusCard } from "@/components/shared/item-detail/item-due-status-card"
import { ItemMeasureInfoCard } from "@/components/shared/item-detail/item-measure-info-card"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getDisplayStatusName,
  isCompleted,
  isOrderItemOverdue,
} from "@/lib/statuses/workflow"
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"
import { format } from "date-fns"

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
          statusVariant={
            isOverdue
              ? "destructive"
              : isPendingReview
                ? "destructive"
                : completed
                  ? "default"
                  : "secondary"
          }
        />
      </div>

      {item.latestResponse && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Отчёт о выполнении</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <span>
                {format(new Date(item.latestResponse.submittedAt), "dd.MM.yyyy HH:mm")}
                {item.latestResponse.submittedByLabel
                  ? ` · ${item.latestResponse.submittedByLabel}`
                  : ""}
              </span>
              <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[item.latestResponse.reviewStatus]}>
                {RESPONSE_REVIEW_STATUS_LABELS[item.latestResponse.reviewStatus]}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {item.latestResponse.result}
            </p>
            {item.latestResponse.commentary && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Комментарий</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {item.latestResponse.commentary}
                </p>
              </div>
            )}
            {item.latestResponse.attachments.length > 0 && (
              <AttachmentGallery
                attachments={item.latestResponse.attachments.map((a) => ({
                  id: a.id,
                  originalName: a.originalName,
                  viewUrl: `/api/report/${token}/attachments/${a.id}`,
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
