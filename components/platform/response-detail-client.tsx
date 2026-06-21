"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ResponseReviewStatus } from "@prisma/client"
import {
  useAdminBreadcrumbLabel,
  useAdminBreadcrumbMiddle,
} from "@/components/platform/platform-breadcrumb"
import { usePlatformUser } from "@/components/platform/use-platform-user"
import { AttachmentGallery } from "@/components/shared/attachment-gallery"
import { PageHeader } from "@/components/shared/page-header"
import {
  MotionActionButton,
  MotionReviewPanel,
  MotionStatusBadge,
} from "@/components/motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TypographyMuted } from "@/components/ui/typography"
import { Permission } from "@/lib/auth/permissions"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import {
  RESPONSE_REVIEW_STATUS_LABELS,
  RESPONSE_REVIEW_STATUS_VARIANT,
} from "@/lib/ui/response-review-status"

export type ResponseDetail = {
  id: number
  result: string
  commentary: string | null
  submittedByLabel: string | null
  submittedAt: string
  reviewStatus: ResponseReviewStatus
  reviewNote: string | null
  reviewedAt: string | null
  reviewedBy: { id: number; name: string } | null
  attachments: {
    id: number
    originalName: string
    mimeType: string
  }[]
  orderItem: {
    id: number
    measure: { id: number; name: string }
    subdivision: { id: number; name: string } | null
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export function ResponseDetailClient({
  response: initialResponse,
}: {
  response: ResponseDetail
}) {
  const router = useRouter()
  const { can } = usePlatformUser()
  const [response, setResponse] = useState(initialResponse)
  const [processing, setProcessing] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [reviewNote, setReviewNote] = useState("")
  const [statusPulseKey, setStatusPulseKey] = useState(0)

  const canReview = can(Permission.ordersWrite)
  const isPending = response.reviewStatus === ResponseReviewStatus.PENDING

  const middleCrumbs = useMemo(
    () => [
      { label: "Отчёты", href: "/panel/responses" },
      { label: "Поручения", href: "/panel/orders" },
      {
        label: response.orderItem.order.title,
        href: `/panel/orders/${response.orderItem.order.id}`,
      },
      { label: response.orderItem.measure.name },
    ],
    [response]
  )

  useAdminBreadcrumbMiddle(middleCrumbs)
  useAdminBreadcrumbLabel("Отчёт")

  async function reviewResponse(action: "accept" | "reject") {
    if (action === "reject" && !reviewNote.trim()) {
      notify.error("Укажите комментарий для исполнителя")
      return
    }

    setProcessing(true)
    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: response.id,
        action,
        reviewNote: action === "reject" ? reviewNote.trim() : undefined,
      }),
    })
    setProcessing(false)

    if (res.ok) {
      notify.success(action === "accept" ? "Отчёт принят" : "Отчёт возвращён на доработку")
      setResponse((prev) => ({
        ...prev,
        reviewStatus:
          action === "accept"
            ? ResponseReviewStatus.ACCEPTED
            : ResponseReviewStatus.REJECTED,
        reviewNote: action === "reject" ? reviewNote.trim() : null,
        reviewedAt: new Date().toISOString(),
      }))
      setRejectMode(false)
      setReviewNote("")
      setStatusPulseKey((key) => key + 1)
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось обработать отчёт")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Отчёт о выполнении"
        description={`${response.orderItem.measure.name} · ${RESPONSE_REVIEW_STATUS_LABELS[response.reviewStatus]}`}
        backHref="/panel/responses"
        backLabel="Отчёты"
        actions={
          isPending && canReview ? (
            rejectMode ? (
              <Button variant="outline" disabled={processing} onClick={() => setRejectMode(false)}>
                Отмена
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <MotionActionButton>
                  <Button disabled={processing} onClick={() => void reviewResponse("accept")}>
                    Принять
                  </Button>
                </MotionActionButton>
                <MotionActionButton>
                  <Button
                    variant="outline"
                    disabled={processing}
                    onClick={() => setRejectMode(true)}
                  >
                    Не принять
                  </Button>
                </MotionActionButton>
              </div>
            )
          ) : (
            <MotionStatusBadge statusKey={response.reviewStatus} pulse={statusPulseKey > 0}>
              <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[response.reviewStatus]}>
                {RESPONSE_REVIEW_STATUS_LABELS[response.reviewStatus]}
              </Badge>
            </MotionStatusBadge>
          )
        }
      />

      <MotionReviewPanel open={isPending && canReview && rejectMode}>
        <Card>
          <CardHeader>
            <CardTitle>Возврат на доработку</CardTitle>
            <CardDescription>
              Укажите, что нужно исправить — комментарий увидит исполнитель
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              placeholder="Комментарий для исполнителя"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={4}
            />
            <MotionActionButton>
              <Button
                variant="destructive"
                disabled={processing || !reviewNote.trim()}
                onClick={() => void reviewResponse("reject")}
              >
                Вернуть на доработку
              </Button>
            </MotionActionButton>
          </CardContent>
        </Card>
      </MotionReviewPanel>

      <Card>
        <CardHeader>
          <CardTitle>
            {response.submittedByLabel ?? "Исполнитель не указан"}
          </CardTitle>
          <CardDescription>
            {format(new Date(response.submittedAt), "dd.MM.yyyy HH:mm")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <TypographyMuted>{labels.org}: {response.orderItem.order.organization.name}</TypographyMuted>
          {response.orderItem.subdivision && (
            <TypographyMuted>
              Подразделение: {response.orderItem.subdivision.name}
            </TypographyMuted>
          )}
        </CardContent>
      </Card>

      {!isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Решение</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Статус</span>
              <MotionStatusBadge
                statusKey={`${response.reviewStatus}-${statusPulseKey}`}
                pulse={statusPulseKey > 0}
              >
                <Badge variant={RESPONSE_REVIEW_STATUS_VARIANT[response.reviewStatus]}>
                  {RESPONSE_REVIEW_STATUS_LABELS[response.reviewStatus]}
                </Badge>
              </MotionStatusBadge>
            </div>
            {response.reviewedAt && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Рассмотрено</span>
                <span>{format(new Date(response.reviewedAt), "dd.MM.yyyy HH:mm")}</span>
              </div>
            )}
            {response.reviewedBy && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Рассмотрел</span>
                <span>{response.reviewedBy.name}</span>
              </div>
            )}
            {response.reviewNote && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Комментарий</span>
                <p className="whitespace-pre-wrap">{response.reviewNote}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{response.result}</p>
        </CardContent>
      </Card>

      {(response.commentary || response.attachments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Комментарий</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {response.commentary && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {response.commentary}
              </p>
            )}
            {response.attachments.length > 0 && (
              <AttachmentGallery
                attachments={response.attachments.map((a) => ({
                  id: a.id,
                  originalName: a.originalName,
                  viewUrl: `/api/attachments/${a.id}`,
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
