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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { notify } from "@/lib/ui/feedback"
import { isSelectableWorkflowStatus } from "@/lib/statuses/workflow"

type Status = { id: number; name: string }
type Subdivision = { id: number; name: string }

type OrderItem = {
  id: number
  dueAt: string
  status: { id: number; name: string; isTerminal?: boolean }
  subdivision: { id: number; name: string } | null
}

type EditOrderItemDialogProps = {
  orderId: number
  item: OrderItem | null
  statuses: Status[]
  subdivisions: Subdivision[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (item: OrderItem) => void
}

function EditOrderItemForm({
  orderId,
  item,
  statuses,
  subdivisions,
  onOpenChange,
  onSaved,
}: {
  orderId: number
  item: OrderItem
  statuses: Status[]
  subdivisions: Subdivision[]
  onOpenChange: (open: boolean) => void
  onSaved: (item: OrderItem) => void
}) {
  const selectableStatuses = statuses.filter((s) => isSelectableWorkflowStatus(s.name))
  const [statusId, setStatusId] = useState(String(item.status.id))
  const [dueAt, setDueAt] = useState(item.dueAt.slice(0, 10))
  const [subdivisionId, setSubdivisionId] = useState(
    item.subdivision ? String(item.subdivision.id) : "none"
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusId: Number(statusId),
        dueAt,
        subdivisionId: subdivisionId === "none" ? null : Number(subdivisionId),
      }),
    })
    setLoading(false)
    if (res.ok) {
      const updated = await res.json()
      onSaved({
        id: updated.id,
        dueAt: updated.dueAt,
        status: {
          id: updated.status.id,
          name: updated.status.name,
          isTerminal: updated.status.isTerminal,
        },
        subdivision: updated.subdivision,
      })
      onOpenChange(false)
      notify.success("Позиция обновлена")
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Ошибка сохранения")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Редактировать позицию</DialogTitle>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="edit-item-status">Статус</FieldLabel>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger id="edit-item-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {selectableStatuses.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Просрочка определяется автоматически по сроку, если мера не завершена.
          </p>
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-item-due">Срок</FieldLabel>
          <Input
            id="edit-item-due"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-item-sub">Подразделение</FieldLabel>
          <Select value={subdivisionId} onValueChange={setSubdivisionId}>
            <SelectTrigger id="edit-item-sub">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">—</SelectItem>
                {subdivisions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="min-h-[52px] text-sm text-destructive">{error}</div>
      </FieldGroup>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={save} disabled={loading}>
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function EditOrderItemDialog({
  orderId,
  item,
  statuses,
  subdivisions,
  open,
  onOpenChange,
  onSaved,
}: EditOrderItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && (
          <EditOrderItemForm
            key={`${item.id}-${item.status.id}-${item.dueAt}-${item.subdivision?.id ?? "none"}`}
            orderId={orderId}
            item={item}
            statuses={statuses}
            subdivisions={subdivisions}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
