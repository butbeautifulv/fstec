"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { format } from "date-fns"
import { usePlatformBreadcrumbLabel } from "@/components/platform/platform-breadcrumb"
import { PageHeader } from "@/components/shared/page-header"
import { MotionActionButton, MotionStatusBadge } from "@/components/motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DELAY_STATUS_LABELS, DELAY_STATUS_VARIANT } from "@/lib/ui/delay-status"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { DelayRequestStatus } from "@prisma/client"

export type DelayRequestDetail = {
  id: number
  status: DelayRequestStatus
  requestedDueAt: string
  justification: string | null
  createdAt: string
  reviewedAt: string | null
  reviewedBy: { id: number; name: string } | null
  orderItem: {
    id: number
    dueAt: string
    measure: { id: number; name: string }
    order: {
      id: number
      title: string
      organization: { id: number; name: string }
    }
  }
}

export function DelayRequestDetailClient({
  delay: initialDelay,
}: {
  delay: DelayRequestDetail
}) {
  const router = useRouter()
  const [delay, setDelay] = useState(initialDelay)
  const [processing, setProcessing] = useState(false)
  const [statusPulseKey, setStatusPulseKey] = useState(0)

  usePlatformBreadcrumbLabel(delay.orderItem.measure.name)

  async function reviewDelay(action: "approve" | "reject") {
    setProcessing(true)
    const res = await fetch("/api/delay-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: delay.id, action }),
    })
    setProcessing(false)
    if (res.ok) {
      notify.success(action === "approve" ? "Перенос одобрен" : "Перенос отклонён")
      setDelay((prev) => ({
        ...prev,
        status:
          action === "approve"
            ? DelayRequestStatus.APPROVED
            : DelayRequestStatus.REJECTED,
        orderItem:
          action === "approve"
            ? { ...prev.orderItem, dueAt: prev.requestedDueAt }
            : prev.orderItem,
      }))
      router.refresh()
      setStatusPulseKey((key) => key + 1)
    } else {
      notify.error("Не удалось обработать запрос")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={delay.orderItem.measure.name}
        description={`Заявка на перенос срока · ${DELAY_STATUS_LABELS[delay.status]}`}
        backHref="/panel/delay-requests"
        backLabel="Переносы"
        actions={
          delay.status === DelayRequestStatus.PENDING ? (
            <div className="flex flex-wrap gap-2">
              <MotionActionButton>
                <Button disabled={processing} onClick={() => void reviewDelay("approve")}>
                  Одобрить
                </Button>
              </MotionActionButton>
              <MotionActionButton>
                <Button
                  variant="outline"
                  disabled={processing}
                  onClick={() => void reviewDelay("reject")}
                >
                  Отклонить
                </Button>
              </MotionActionButton>
            </div>
          ) : (
            <MotionStatusBadge statusKey={`${delay.status}-${statusPulseKey}`} pulse={statusPulseKey > 0}>
              <Badge variant={DELAY_STATUS_VARIANT[delay.status]}>
                {DELAY_STATUS_LABELS[delay.status]}
              </Badge>
            </MotionStatusBadge>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сроки</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Текущий срок</span>
              <span>{format(new Date(delay.orderItem.dueAt), "dd.MM.yyyy")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Запрошенный срок</span>
              <span>{format(new Date(delay.requestedDueAt), "dd.MM.yyyy")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Запрошено</span>
              <span>{format(new Date(delay.createdAt), "dd.MM.yyyy HH:mm")}</span>
            </div>
            {delay.reviewedAt && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Рассмотрено</span>
                <span>{format(new Date(delay.reviewedAt), "dd.MM.yyyy HH:mm")}</span>
              </div>
            )}
            {delay.reviewedBy && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Рассмотрел</span>
                <span>{delay.reviewedBy.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Контекст</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">{labels.org}</span>
              <Link
                href={`/panel/organizations/${delay.orderItem.order.organization.id}`}
                className="font-medium hover:underline"
              >
                {delay.orderItem.order.organization.name}
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Поручение</span>
              <Link
                href={`/panel/orders/${delay.orderItem.order.id}`}
                className="font-medium hover:underline"
              >
                {delay.orderItem.order.title}
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Мера</span>
              <Link
                href={`/panel/measures/${delay.orderItem.measure.id}/edit`}
                className="font-medium hover:underline"
              >
                {delay.orderItem.measure.name}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Обоснование</CardTitle>
          <CardDescription>Причина запроса на перенос срока</CardDescription>
        </CardHeader>
        <CardContent>
          {delay.justification ? (
            <p className="whitespace-pre-wrap text-sm">{delay.justification}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Обоснование не указано</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
