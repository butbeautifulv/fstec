"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
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
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/ui/feedback"

export function MeasureForm({
  initial,
  measureId,
}: {
  initial?: { name: string; description?: string | null; code?: string | null }
  measureId?: number
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? "")
  const [code, setCode] = useState(initial?.code ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const url = measureId ? `/api/measures/${measureId}` : "/api/measures"
    const method = measureId ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code: code || null,
        description: description || null,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Save failed")
      return
    }
    notify.success("Мера сохранена")
    router.push("/panel/measures")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основное</CardTitle>
            <CardDescription>Название и код меры в каталоге ФСТЭК</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Название</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code">Код ФСТЭК</FieldLabel>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Описание</CardTitle>
            <CardDescription>Текст, который увидят исполнители в публичной панели</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="description">Описание</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[140px] leading-relaxed"
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <FormActionsBar error={error}>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>
      </FormActionsBar>
    </form>
  )
}
