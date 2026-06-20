"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"
import { isSelectableWorkflowStatus } from "@/lib/statuses/workflow"

type Status = { id: number; name: string; isTerminal?: boolean }
type Subdivision = { id: number; name: string }

export function OrderItemEditForm({
  orderId,
  item,
  statuses,
  subdivisions,
}: {
  orderId: number
  item: {
    id: number
    dueAt: string
    status: { id: number; name: string; isTerminal?: boolean }
    subdivision: Subdivision | null
    measure: { id: number; name: string }
  }
  statuses: Status[]
  subdivisions: Subdivision[]
}) {
  const router = useRouter()
  const selectableStatuses = statuses.filter((s) => isSelectableWorkflowStatus(s.name))
  const [statusId, setStatusId] = useState(String(item.status.id))
  const [dueAt, setDueAt] = useState(item.dueAt.slice(0, 10))
  const [subdivisionId, setSubdivisionId] = useState(
    item.subdivision ? String(item.subdivision.id) : "none"
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Ошибка сохранения")
      return
    }
    notify.success("Позиция обновлена")
    router.push(`/panel/orders/${orderId}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormCardLayout
        singleCard
        actions={
          <FormActionsBar error={error}>
            <Button variant="outline" asChild disabled={loading}>
              <Link href={`/panel/orders/${orderId}`}>Отмена</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </FormActionsBar>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{item.measure.name}</CardTitle>
            <CardDescription>Статус, срок и подразделение</CardDescription>
          </CardHeader>
          <CardContent>
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
                  required
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
            </FieldGroup>
          </CardContent>
        </Card>
      </FormCardLayout>
    </form>
  )
}
