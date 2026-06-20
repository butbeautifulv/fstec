"use client"

import { useMemo, useState } from "react"
import { ResponseReviewStatus } from "@prisma/client"
import { ItemDetailHeaderActions } from "@/components/shared/item-detail/item-detail-header-actions"
import { ItemDueStatusCard } from "@/components/shared/item-detail/item-due-status-card"
import { ItemMeasureInfoCard } from "@/components/shared/item-detail/item-measure-info-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  CommentaryAttachmentsField,
  useCommentaryAttachmentsState,
} from "@/components/shared/commentary-attachments-field"
import { DelayRequestDialog } from "@/components/public/delay-request-dialog"
import {
  usePublicBreadcrumbLabel,
  usePublicBreadcrumbMiddle,
} from "@/components/public/public-breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { notify } from "@/lib/ui/feedback"
import {
  getDisplayStatusName,
  isCompleted,
  isInProgress,
  isNotStarted,
  isOrderItemOverdue,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"
import { getItemDetailStatusVariant } from "@/lib/ui/item-detail-status"
import { CalendarClockIcon } from "lucide-react"

type PublicStatus = { id: number; name: string; isTerminal: boolean }

type LatestResponse = {
  reviewStatus: ResponseReviewStatus
  reviewNote: string | null
  result: string
  commentary: string | null
  submittedAt: string
  submittedByLabel: string | null
}

type PublicItem = {
  id: number
  dueAt: string
  measure: { name: string; code: string | null; description: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderTitle: string
}

export function PublicItemDetail({
  token,
  item: initialItem,
  orderId,
  statuses,
  organizationName,
  subdivisionName,
  latestResponse: initialLatestResponse,
}: {
  token: string
  item: PublicItem
  orderId: number
  statuses: PublicStatus[]
  organizationName: string
  subdivisionName: string | null
  latestResponse: LatestResponse | null
}) {
  const statusMeta = statuses.find((s) => s.id === initialItem.status.id)
  const [item, setItem] = useState({
    ...initialItem,
    status: {
      ...initialItem.status,
      isTerminal: statusMeta?.isTerminal ?? initialItem.status.name === WORKFLOW_STATUS.COMPLETED,
    },
  })
  const [latestResponse, setLatestResponse] = useState(initialLatestResponse)
  const [submitter, setSubmitter] = useState("")
  const [result, setResult] = useState("")
  const [commentaryState, setCommentaryState] = useCommentaryAttachmentsState()
  const [delayOpen, setDelayOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isOverdue = isOrderItemOverdue(item)
  const completed = isCompleted(item.status)
  const canStart = isNotStarted(item.status.name)
  const isPendingReview = latestResponse?.reviewStatus === ResponseReviewStatus.PENDING
  const isRejected = latestResponse?.reviewStatus === ResponseReviewStatus.REJECTED
  const canSubmitReport =
    isInProgress(item.status.name) && !completed && !isPendingReview
  const displayStatus = isPendingReview ? "На проверке" : getDisplayStatusName(item)

  const middleCrumbs = useMemo(
    () => [
      { label: "Сводка", href: `/p/${token}` },
      { label: "Поручения", href: `/p/${token}/orders` },
      {
        label: item.orderTitle,
        href: `/p/${token}/orders/${orderId}`,
      },
    ],
    [token, orderId, item.orderTitle]
  )

  usePublicBreadcrumbMiddle(middleCrumbs)
  usePublicBreadcrumbLabel(item.measure.name)

  async function startWork() {
    setStarting(true)
    const res = await fetch(`/api/public/${token}/items/${item.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    })
    setStarting(false)
    if (res.ok) {
      const updated = await res.json()
      setItem((prev) => ({
        ...prev,
        status: {
          id: updated.status.id,
          name: updated.status.name,
          isTerminal: updated.status.isTerminal,
        },
      }))
      notify.success("Мера взята в работу")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось взять меру в работу")
    }
  }

  async function submitReport() {
    setSubmitting(true)
    const res = await fetch(`/api/public/${token}/items/${item.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result,
        commentary: commentaryState.commentary.trim() || null,
        submittedByLabel: submitter || null,
        attachmentIds: commentaryState.attachmentIds,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const data = await res.json()
      setLatestResponse({
        reviewStatus: ResponseReviewStatus.PENDING,
        reviewNote: null,
        result: data.response.result,
        commentary: data.response.commentary,
        submittedAt: data.response.submittedAt,
        submittedByLabel: data.response.submittedByLabel,
      })
      setResult("")
      setCommentaryState({ commentary: "", attachmentIds: [] })
      notify.success("Отчёт отправлен, ожидает проверки")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось отправить отчёт")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={item.measure.name}
        description={`${organizationName}${subdivisionName ? ` · ${subdivisionName}` : ""}`}
        actions={
          <ItemDetailHeaderActions
            code={item.measure.code}
            orderTitle={item.orderTitle}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ItemMeasureInfoCard
          description={item.measure.description}
          organizationName={organizationName}
          subdivisionName={subdivisionName}
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
          footer={
            !completed ? (
              <Button variant="outline" size="sm" onClick={() => setDelayOpen(true)}>
                <CalendarClockIcon data-icon="inline-start" />
                Запросить перенос
              </Button>
            ) : undefined
          }
        >
          {canStart && (
            <Button onClick={startWork} disabled={starting} className="w-full sm:w-auto">
              Взять в работу
            </Button>
          )}
        </ItemDueStatusCard>
      </div>

      {isRejected && latestResponse?.reviewNote && (
        <Alert variant="destructive">
          <AlertTitle>Отчёт не принят</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {latestResponse.reviewNote}
          </AlertDescription>
        </Alert>
      )}

      <Card
        className={
          completed
            ? "border-primary/30 bg-primary/5"
            : isPendingReview
              ? "border-destructive/30 bg-destructive/5"
              : canSubmitReport
                ? "border-primary/30"
                : ""
        }
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
        <CardContent>
          {completed ? (
            <p className="text-sm text-muted-foreground">Дополнительных действий не требуется.</p>
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
                  value={submitter}
                  onChange={(e) => setSubmitter(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="result">Описание выполненных работ</FieldLabel>
                <Textarea
                  id="result"
                  placeholder="Опишите, что сделано по мере"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={6}
                  className="min-h-32"
                />
              </Field>
              <CommentaryAttachmentsField
                presignUrl={`/api/public/${token}/items/${item.id}/attachments/presign`}
                value={commentaryState}
                onChange={setCommentaryState}
              />
            </FieldGroup>
          )}
        </CardContent>
        {canSubmitReport && (
          <CardFooter>
            <Button onClick={submitReport} disabled={!result.trim() || submitting}>
              Отправить отчёт
            </Button>
          </CardFooter>
        )}
      </Card>

      <DelayRequestDialog
        open={delayOpen}
        onOpenChange={setDelayOpen}
        token={token}
        itemId={item.id}
        currentDueAt={item.dueAt}
      />
    </div>
  )
}
