"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommentaryAttachmentsField,
  useCommentaryAttachmentsState,
} from "@/components/shared/commentary-attachments-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/ui/feedback"

type SubmitItem = {
  id: number
  measure: { name: string }
}

export function SubmitResponseDialog({
  orderId,
  item,
  open,
  onOpenChange,
}: {
  orderId: number
  item: SubmitItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [result, setResult] = useState("")
  const [commentaryState, setCommentaryState] = useCommentaryAttachmentsState()
  const [submitting, setSubmitting] = useState(false)

  if (!item) return null

  const presignUrl = `/api/orders/${orderId}/items/${item.id}/attachments/presign`

  async function handleSubmit() {
    if (!item || !result.trim()) return
    setSubmitting(true)
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

    if (res.ok) {
      notify.success("Отчёт отправлен, ожидает проверки")
      setResult("")
      setCommentaryState({ commentary: "", attachmentIds: [] })
      onOpenChange(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось отправить отчёт")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Отправить отчёт</DialogTitle>
          <DialogDescription>{item.measure.name}</DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="panel-result">Описание выполненных работ</FieldLabel>
            <Textarea
              id="panel-result"
              placeholder="Опишите, что сделано по мере"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={5}
            />
          </Field>

          <CommentaryAttachmentsField
            presignUrl={presignUrl}
            value={commentaryState}
            onChange={setCommentaryState}
          />
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!result.trim() || submitting}>
            Отправить отчёт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
