"use client"

import { useState } from "react"
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
import { notify } from "@/lib/ui/feedback"

type Order = { id: number; title: string }

type EditOrderDialogProps = {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (order: Order) => void
}

function EditOrderForm({
  order,
  onOpenChange,
  onSaved,
}: {
  order: Order
  onOpenChange: (open: boolean) => void
  onSaved: (order: Order) => void
}) {
  const [title, setTitle] = useState(order.title)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!title.trim()) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    setLoading(false)
    if (res.ok) {
      const updated = await res.json()
      onSaved({ id: updated.id, title: updated.title })
      onOpenChange(false)
      notify.success("Поручение обновлено")
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Ошибка сохранения")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Редактировать поручение</DialogTitle>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="edit-order-title">Название</FieldLabel>
          <Input
            id="edit-order-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="min-h-[52px] text-sm text-destructive">{error}</div>
      </FieldGroup>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={save} disabled={!title.trim() || loading}>
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function EditOrderDialog({
  order,
  open,
  onOpenChange,
  onSaved,
}: EditOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {order && (
          <EditOrderForm
            key={`${order.id}-${order.title}`}
            order={order}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
