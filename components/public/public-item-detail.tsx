"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { DelayRequestDialog } from "@/components/public/delay-request-dialog"
import {
  usePublicBreadcrumbLabel,
  usePublicBreadcrumbMiddle,
} from "@/components/public/public-breadcrumb"
import { Badge } from "@/components/ui/badge"
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
import { format } from "date-fns"
import { CalendarClockIcon, ClipboardListIcon } from "lucide-react"

type PublicStatus = { id: number; name: string; isTerminal: boolean }

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
}: {
  token: string
  item: PublicItem
  orderId: number
  statuses: PublicStatus[]
  organizationName: string
  subdivisionName: string | null
}) {
  const statusMeta = statuses.find((s) => s.id === initialItem.status.id)
  const [item, setItem] = useState({
    ...initialItem,
    status: {
      ...initialItem.status,
      isTerminal: statusMeta?.isTerminal ?? initialItem.status.name === WORKFLOW_STATUS.COMPLETED,
    },
  })
  const [submitter, setSubmitter] = useState("")
  const [result, setResult] = useState("")
  const [delayOpen, setDelayOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isOverdue = isOrderItemOverdue(item)
  const displayStatus = getDisplayStatusName(item)
  const completed = isCompleted(item.status)
  const canStart = isNotStarted(item.status.name)
  const canSubmitReport = isInProgress(item.status.name) && !completed

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
        commentary: null,
        submittedByLabel: submitter || null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const data = await res.json()
      setItem((prev) => ({
        ...prev,
        status: {
          id: data.item.status.id,
          name: data.item.status.name,
          isTerminal: data.item.status.isTerminal,
        },
      }))
      setResult("")
      notify.success("Отчёт отправлен, мера завершена")
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
          <div className="flex flex-wrap items-center gap-2">
            {item.measure.code && (
              <Badge variant="secondary" className="font-mono">
                {item.measure.code}
              </Badge>
            )}
            <Badge variant="outline">
              <ClipboardListIcon data-icon="inline-start" />
              {item.orderTitle}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">О мере</CardTitle>
            <CardDescription>Описание и контекст поручения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.measure.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {item.measure.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Описание меры не указано администратором.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{organizationName}</Badge>
              {subdivisionName && <Badge variant="outline">{subdivisionName}</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className={isOverdue ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardHeader>
            <CardTitle className="text-base">Срок и статус</CardTitle>
            <CardDescription>Текущее состояние исполнения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-3xl font-medium tabular-nums">
                {format(new Date(item.dueAt), "dd.MM.yyyy")}
              </span>
              <Badge variant={isOverdue ? "destructive" : completed ? "default" : "secondary"}>
                {displayStatus}
              </Badge>
            </div>
            {canStart && (
              <Button onClick={startWork} disabled={starting} className="w-full sm:w-auto">
                Взять в работу
              </Button>
            )}
          </CardContent>
          {!completed && (
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => setDelayOpen(true)}>
                <CalendarClockIcon data-icon="inline-start" />
                Запросить перенос
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card
        className={
          completed
            ? "border-primary/30 bg-primary/5"
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
              : canSubmitReport
                ? "Опишите выполненные работы и отправьте отчёт."
                : "Сначала возьмите меру в работу."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completed ? (
            <p className="text-sm text-muted-foreground">Дополнительных действий не требуется.</p>
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
