"use client"

import { ResponseReviewStatus } from "@prisma/client"
import {
  CommentaryAttachmentsField,
  type CommentaryAttachmentsValue,
} from "@/components/shared/commentary-attachments-field"
import { ItemResponseCard } from "@/components/shared/item-detail/item-response-card"
import { ResponseRevisionAlert } from "@/components/shared/response-revision-alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ReadonlyResponse = {
  reviewStatus: ResponseReviewStatus
  reviewNote?: string | null
  result: string
  commentary: string | null
  submittedAt: string
  submittedByLabel: string | null
  attachments?: { id: number; originalName: string }[]
}

export function ItemReportWorkflowCard({
  completed,
  isPendingReview,
  isRejected,
  canSubmitReport,
  latestResponse,
  attachmentViewUrl,
  submitter,
  onSubmitterChange,
  result,
  onResultChange,
  commentaryState,
  onCommentaryChange,
  presignUrl,
  onSubmit,
  submitting,
}: {
  completed: boolean
  isPendingReview: boolean
  isRejected: boolean
  canSubmitReport: boolean
  latestResponse: ReadonlyResponse | null
  attachmentViewUrl?: (attachmentId: number) => string
  submitter?: string
  onSubmitterChange?: (value: string) => void
  result?: string
  onResultChange?: (value: string) => void
  commentaryState?: CommentaryAttachmentsValue
  onCommentaryChange?: (value: CommentaryAttachmentsValue) => void
  presignUrl?: string
  onSubmit?: () => void
  submitting?: boolean
}) {
  if (completed && latestResponse) {
    return (
      <ItemResponseCard
        result={latestResponse.result}
        commentary={latestResponse.commentary}
        submittedAt={latestResponse.submittedAt}
        submittedByLabel={latestResponse.submittedByLabel}
        reviewStatus={latestResponse.reviewStatus}
        attachments={latestResponse.attachments}
        attachmentViewUrl={attachmentViewUrl}
      />
    )
  }

  return (
    <Card
      className={cn(
        completed && "border-primary/30 bg-primary/5",
        isPendingReview && "border-destructive/30 bg-destructive/5",
        isRejected && "border-destructive/30 bg-destructive/5",
        canSubmitReport &&
          !completed &&
          !isPendingReview &&
          !isRejected &&
          "border-primary/30"
      )}
    >
      <CardHeader>
        <CardTitle className="text-base">Отчёт о выполнении</CardTitle>
        <CardDescription>
          {completed
            ? "Мера завершена, отчёт принят."
            : isPendingReview
              ? "Отчёт отправлен и ожидает проверки оператором."
              : isRejected
                ? "Исправьте замечания и отправьте отчёт повторно."
                : canSubmitReport
                  ? "Опишите выполненные работы и отправьте отчёт."
                  : "Сначала возьмите меру в работу."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isRejected && latestResponse?.reviewNote && (
          <ResponseRevisionAlert reviewNote={latestResponse.reviewNote} />
        )}
        {completed ? (
          <p className="text-sm text-muted-foreground">
            Дополнительных действий не требуется.
          </p>
        ) : isPendingReview ? (
          <p className="text-sm text-muted-foreground">
            После проверки статус меры обновится автоматически.
          </p>
        ) : !canSubmitReport ? (
          <p className="text-sm text-muted-foreground">
            Нажмите «Взять в работу», чтобы открыть форму отчёта.
          </p>
        ) : (
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="submitter">ФИО исполнителя</FieldLabel>
              <Input
                id="submitter"
                placeholder="Необязательно"
                value={submitter ?? ""}
                onChange={(e) => onSubmitterChange?.(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="result">Описание выполненных работ</FieldLabel>
              <Textarea
                id="result"
                placeholder="Опишите, что сделано по мере"
                value={result ?? ""}
                onChange={(e) => onResultChange?.(e.target.value)}
                rows={6}
                className="min-h-32"
              />
            </Field>
            {commentaryState && onCommentaryChange && presignUrl && (
              <CommentaryAttachmentsField
                presignUrl={presignUrl}
                value={commentaryState}
                onChange={onCommentaryChange}
              />
            )}
          </FieldGroup>
        )}
      </CardContent>
      {canSubmitReport && onSubmit && (
        <CardFooter>
          <Button
            onClick={onSubmit}
            disabled={!result?.trim() || submitting}
          >
            Отправить отчёт
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
