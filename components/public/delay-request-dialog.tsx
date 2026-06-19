"use client"

import { useMemo, useState } from "react"
import { addDays, format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/ui/feedback"

type DelayRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  itemId: number
  currentDueAt: string
}

export function DelayRequestDialog({
  open,
  onOpenChange,
  token,
  itemId,
  currentDueAt,
}: DelayRequestDialogProps) {
  const minDate = useMemo(() => {
    const due = new Date(currentDueAt)
    const tomorrow = addDays(new Date(), 1)
    const candidate = due > tomorrow ? addDays(due, 1) : tomorrow
    return format(candidate, "yyyy-MM-dd")
  }, [currentDueAt])

  const [delayDate, setDelayDate] = useState("")
  const [justification, setJustification] = useState("")
  const [loading, setLoading] = useState(false)

  async function submitDelay() {
    if (!delayDate) return
    setLoading(true)
    const res = await fetch(`/api/public/${token}/items/${itemId}/delays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedDueAt: delayDate,
        justification: justification || null,
      }),
    })
    setLoading(false)
    if (res.ok) {
      notify.success("Запрос на перенос отправлен")
      setDelayDate("")
      setJustification("")
      onOpenChange(false)
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось отправить запрос")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 p-4 sm:max-w-sm">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>Запрос переноса срока</DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="delay-date">Новая дата</FieldLabel>
                <Input
                  id="delay-date"
                  type="date"
                  min={minDate}
                  value={delayDate}
                  onChange={(e) => setDelayDate(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="delay-justification">Обоснование</FieldLabel>
                <Textarea
                  id="delay-justification"
                  placeholder="Кратко укажите причину переноса"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Отмена
              </Button>
              <Button onClick={submitDelay} disabled={!delayDate || loading}>
                Отправить запрос
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
