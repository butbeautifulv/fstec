"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { parseApiError, useCrudSubmit } from "@/components/platform/crud/use-crud-submit"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"

type Subdivision = { id: number; name: string }

export function SubdivisionForm({
  organizationId,
  subdivision,
}: {
  organizationId: number
  subdivision?: Subdivision
}) {
  const router = useRouter()
  const isEdit = subdivision != null
  const [name, setName] = useState(subdivision?.name ?? "")

  const submitFn = useCallback(async () => {
    const res = await fetch(
      isEdit ? `/api/subdivisions/${subdivision.id}` : "/api/subdivisions",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { name } : { organizationId, name }
        ),
      }
    )
    if (res.ok) {
      notify.success(isEdit ? "Подразделение обновлено" : "Подразделение добавлено")
      router.push(`/panel/organizations/${organizationId}/links`)
      router.refresh()
      return { ok: true as const }
    }
    return {
      ok: false as const,
      error: await parseApiError(res, "Ошибка сохранения"),
    }
  }, [isEdit, subdivision, organizationId, name, router])

  const { loading, error, submit } = useCrudSubmit(submitFn)

  return (
    <div className="flex flex-col gap-4">
      <FormCardLayout
        singleCard
        actions={
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
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основное</CardTitle>
            <CardDescription>Название подразделения для разграничения доступа</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="sub-name">Название</FieldLabel>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          </CardContent>
        </Card>
      </FormCardLayout>
    </div>
  )
}
