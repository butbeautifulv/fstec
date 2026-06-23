"use client"

import { ResponseReviewStatus } from "@prisma/client"
import {
  CommentaryAttachmentsField,
  type CommentaryAttachmentsValue,
} from "@/components/shared/commentary-attachments-field"
import { ItemResponseCard } from "@/components/shared/item-detail/item-response-card"
import { ResponseRevisionAlert } from "@/components/shared/response-revision-alert"
import {
  MotionPulseText,
  MotionStagger,
  MotionStaggerItem,
  MotionWorkflowPanel,
} from "@/components/motion"
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
import { getItemWorkflowPhase } from "@/lib/ui/item-detail-display"
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

function workflowCardClassName(
  phase: ReturnType<typeof getItemWorkflowPhase>
) {
  return cn(
    phase === "completed" && "border-primary/30 bg-primary/5",
    phase === "pending_review" && "border-destructive/30 bg-destructive/5",
    phase === "rejected" && "border-destructive/30 bg-destructive/5",
    phase === "in_progress_form" && "border-primary/30"
  )
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
  const phase = getItemWorkflowPhase({
    completed,
    isPendingReview,
    isRejected,
    canSubmitReport,
  })

  if (phase === "completed" && latestResponse) {
    return (
      <MotionWorkflowPanel phase={phase}>
        <ItemResponseCard
          result={latestResponse.result}
          commentary={latestResponse.commentary}
          submittedAt={latestResponse.submittedAt}
          submittedByLabel={latestResponse.submittedByLabel}
          reviewStatus={latestResponse.reviewStatus}
          attachments={latestResponse.attachments}
          attachmentViewUrl={attachmentViewUrl}
        />
      </MotionWorkflowPanel>
    )
  }

  const description =
    phase === "pending_review"
      ? "Отчёт отправлен и ожидает проверки оператором."
      : phase === "rejected"
        ? "Исправьте замечания и приложите отчёт повторно."
        : "Опишите выполненные работы и приложите отчёт."

  return (
    <Card className={workflowCardClassName(phase)}>
      <CardHeader>
        <CardTitle className="text-base">Отчёт о выполнении</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <MotionWorkflowPanel phase={phase}>
        <CardContent className="flex flex-col gap-4 pt-0">
          {phase === "rejected" && latestResponse?.reviewNote && (
            <ResponseRevisionAlert reviewNote={latestResponse.reviewNote} />
          )}

          {phase === "pending_review" ? (
            <MotionPulseText active>
              <p className="text-sm text-muted-foreground">
                После проверки статус меры обновится автоматически.
              </p>
            </MotionPulseText>
          ) : (
            <MotionStagger variant="workflow" className="flex flex-col gap-4">
              <FieldGroup className="gap-4">
                <MotionStaggerItem variant="workflow">
                  <Field>
                    <FieldLabel htmlFor="submitter">ФИО исполнителя</FieldLabel>
                    <Input
                      id="submitter"
                      placeholder="Необязательно"
                      value={submitter ?? ""}
                      onChange={(e) => onSubmitterChange?.(e.target.value)}
                    />
                  </Field>
                </MotionStaggerItem>
                <MotionStaggerItem variant="workflow">
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
                </MotionStaggerItem>
                {commentaryState && onCommentaryChange && presignUrl && (
                  <MotionStaggerItem variant="workflow">
                    <CommentaryAttachmentsField
                      presignUrl={presignUrl}
                      value={commentaryState}
                      onChange={onCommentaryChange}
                    />
                  </MotionStaggerItem>
                )}
              </FieldGroup>
            </MotionStagger>
          )}
        </CardContent>

        {canSubmitReport && onSubmit && (
          <CardFooter>
            <Button onClick={onSubmit} disabled={!result?.trim() || submitting}>
              {phase === "rejected" ? "Отправить повторно" : "Приложить отчёт"}
            </Button>
          </CardFooter>
        )}
      </MotionWorkflowPanel>
    </Card>
  )
}
