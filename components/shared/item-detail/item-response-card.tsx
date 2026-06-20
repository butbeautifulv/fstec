import { ResponseReviewStatus } from "@prisma/client"
import { format } from "date-fns"
import { AttachmentGallery } from "@/components/shared/attachment-gallery"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"

type ItemResponseAttachment = {
  id: number
  originalName: string
}

export function ItemResponseCard({
  result,
  commentary,
  submittedAt,
  submittedByLabel,
  reviewStatus,
  attachments = [],
  attachmentViewUrl,
}: {
  result: string
  commentary?: string | null
  submittedAt: string
  submittedByLabel?: string | null
  reviewStatus: ResponseReviewStatus
  attachments?: ItemResponseAttachment[]
  attachmentViewUrl?: (attachmentId: number) => string
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Отчёт о выполнении</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>
            {format(new Date(submittedAt), "dd.MM.yyyy HH:mm")}
            {submittedByLabel ? ` · ${submittedByLabel}` : ""}
          </span>
          <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[reviewStatus]}>
            {RESPONSE_REVIEW_STATUS_LABELS[reviewStatus]}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        {commentary && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Комментарий</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {commentary}
            </p>
          </div>
        )}
        {attachments.length > 0 && attachmentViewUrl && (
          <AttachmentGallery
            attachments={attachments.map((attachment) => ({
              id: attachment.id,
              originalName: attachment.originalName,
              viewUrl: attachmentViewUrl(attachment.id),
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}
