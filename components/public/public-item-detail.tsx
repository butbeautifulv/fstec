"use client"

import { useMemo, useState } from "react"
import { ResponseReviewStatus } from "@prisma/client"
import { ItemDetailOverview } from "@/components/shared/item-detail/item-detail-overview"
import { ItemReportWorkflowCard } from "@/components/shared/item-detail/item-report-workflow-card"
import {
  useCommentaryAttachmentsState,
} from "@/components/shared/commentary-attachments-field"
import { DelayRequestDialog } from "@/components/public/delay-request-dialog"
import {
  usePublicBreadcrumbLabel,
  usePublicBreadcrumbMiddle,
} from "@/components/public/public-breadcrumb"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/ui/feedback"
import { WORKFLOW_STATUS } from "@/lib/statuses/workflow"
import { getItemDetailDisplayState } from "@/lib/ui/item-detail-display"
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

  const {
    isOverdue,
    completed,
    isPendingReview,
    isRejected,
    canStart,
    canSubmitReport,
    displayStatus,
    statusVariant,
  } = getItemDetailDisplayState(item, latestResponse)

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
    <>
      <ItemDetailOverview
        title={item.measure.name}
        description={`${organizationName}${subdivisionName ? ` · ${subdivisionName}` : ""}`}
        measureCode={item.measure.code}
        orderTitle={item.orderTitle}
        measureDescription={item.measure.description}
        organizationName={organizationName}
        subdivisionName={subdivisionName}
        dueAt={item.dueAt}
        displayStatus={displayStatus}
        isOverdue={isOverdue}
        statusVariant={statusVariant}
        dueStatusFooter={
          !completed ? (
            <Button variant="outline" size="sm" onClick={() => setDelayOpen(true)}>
              <CalendarClockIcon data-icon="inline-start" />
              Запросить перенос
            </Button>
          ) : undefined
        }
        dueStatusChildren={
          canStart ? (
            <Button onClick={startWork} disabled={starting} className="w-full sm:w-auto">
              Взять в работу
            </Button>
          ) : undefined
        }
      >
        <ItemReportWorkflowCard
          completed={completed}
          isPendingReview={isPendingReview}
          isRejected={isRejected}
          canSubmitReport={canSubmitReport}
          latestResponse={latestResponse}
          attachmentViewUrl={(attachmentId) =>
            `/api/public/${token}/attachments/${attachmentId}`
          }
          submitter={submitter}
          onSubmitterChange={setSubmitter}
          result={result}
          onResultChange={setResult}
          commentaryState={commentaryState}
          onCommentaryChange={setCommentaryState}
          presignUrl={`/api/public/${token}/items/${item.id}/attachments/presign`}
          onSubmit={submitReport}
          submitting={submitting}
        />
      </ItemDetailOverview>

      <DelayRequestDialog
        open={delayOpen}
        onOpenChange={setDelayOpen}
        token={token}
        itemId={item.id}
        currentDueAt={item.dueAt}
      />
    </>
  )
}
