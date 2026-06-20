"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  CommentaryAttachmentsField,
  useCommentaryAttachmentsState,
} from "@/components/shared/commentary-attachments-field"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { FormCardLayout } from "@/components/shared/form-card-grid"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/ui/feedback"

export function SubmitOrderItemResponseForm({
  orderId,
  item,
}: {
  orderId: number
  item: { id: number; measure: { name: string } }
}) {
  const router = useRouter()
  const [result, setResult] = useState("")
  const [commentaryState, setCommentaryState] = useCommentaryAttachmentsState()
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const presignUrl = `/api/orders/${orderId}/items/${item.id}/attachments/presign`

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!result.trim()) return
    setSubmitting(true)
    setError("")
    const res = await fetch(`/api/orders/${orderId}/items/${item.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result: result.trim(),
        commentary: commentaryState.commentary.trim() || null,
        attachmentIds: commentaryState.attachmentIds,
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Не удалось отправить отчёт")
      return
    }
    notify.success("Отчёт отправлен, ожидает проверки")
    router.push(`/panel/orders/${orderId}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormCardLayout
        singleCard
        actions={
          <FormActionsBar error={error}>
            <Button variant="outline" asChild disabled={submitting}>
              <Link href={`/panel/orders/${orderId}`}>Отмена</Link>
            </Button>
            <Button type="submit" disabled={!result.trim() || submitting}>
              {submitting && <Spinner data-icon="inline-start" />}
              {submitting ? "Отправка..." : "Отправить отчёт"}
            </Button>
          </FormActionsBar>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Отчёт о выполнении</CardTitle>
            <CardDescription>{item.measure.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="panel-result">Описание выполненных работ</FieldLabel>
                <Textarea
                  id="panel-result"
                  placeholder="Опишите, что сделано по мере"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={5}
                  className="min-h-32"
                  required
                />
              </Field>
              <CommentaryAttachmentsField
                presignUrl={presignUrl}
                value={commentaryState}
                onChange={setCommentaryState}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </FormCardLayout>
    </form>
  )
}
