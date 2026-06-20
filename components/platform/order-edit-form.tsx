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
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"

export function OrderEditForm({
  order,
}: {
  order: { id: number; title: string }
}) {
  const router = useRouter()
  const [title, setTitle] = useState(order.title)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Ошибка сохранения")
      return
    }
    notify.success("Поручение обновлено")
    router.push(`/panel/orders/${order.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormCardLayout
        singleCard
        actions={
          <FormActionsBar error={error}>
            <Button variant="outline" asChild disabled={loading}>
              <Link href={`/panel/orders/${order.id}`}>Отмена</Link>
            </Button>
            <Button type="submit" disabled={!title.trim() || loading}>
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </FormActionsBar>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основное</CardTitle>
            <CardDescription>Название поручения</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-order-title">Название</FieldLabel>
                <Input
                  id="edit-order-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </FormCardLayout>
    </form>
  )
}
