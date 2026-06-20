"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { parseApiError, useCrudSubmit } from "@/components/platform/crud/use-crud-submit"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"

type Org = { id: number; name: string; shortCode: string | null }

export function OrganizationForm({ organization }: { organization?: Org }) {
  const router = useRouter()
  const isEdit = organization != null
  const [name, setName] = useState(organization?.name ?? "")
  const [shortCode, setShortCode] = useState(organization?.shortCode ?? "")

  const submitFn = useCallback(async () => {
    const res = await fetch("/api/organizations", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? { id: organization.id, name, shortCode: shortCode || null }
          : { name, shortCode: shortCode || null }
      ),
    })
    if (res.ok) {
      const saved = await res.json()
      notify.success(isEdit ? `${labels.org} обновлена` : `${labels.org} добавлена`)
      router.push(isEdit ? `/panel/organizations/${saved.id}` : "/panel/organizations")
      router.refresh()
      return { ok: true as const }
    }
    return {
      ok: false as const,
      error: await parseApiError(res, "Ошибка сохранения"),
    }
  }, [isEdit, organization, name, shortCode, router])

  const { loading, error, submit } = useCrudSubmit(submitFn)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основное</CardTitle>
            <CardDescription>Название {labels.orgGenitive}</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="org-name">Название</FieldLabel>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Код</CardTitle>
            <CardDescription>Краткий идентификатор для ссылок и отчётов</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="org-code">Краткий код</FieldLabel>
              <Input
                id="org-code"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <FormActionsBar error={error}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !name.trim()}
        >
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
        </Button>
      </FormActionsBar>
    </div>
  )
}
