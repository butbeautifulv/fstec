"use client"

import { useCallback, useState } from "react"
import { FormDialog } from "@/components/admin/crud/form-dialog"
import { parseApiError, useCrudSubmit } from "@/components/admin/crud/use-crud-submit"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { notify } from "@/lib/ui/feedback"

type Subdivision = { id: number; name: string }

type SubdivisionDialogProps = {
  organizationId: number
  subdivision?: Subdivision | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (sub: Subdivision) => void
}

function SubdivisionForm({
  organizationId,
  subdivision,
  open,
  onOpenChange,
  onSaved,
}: SubdivisionDialogProps) {
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
      const saved = await res.json()
      onSaved(saved)
      onOpenChange(false)
      notify.success(isEdit ? "Подразделение обновлено" : "Подразделение добавлено")
      return { ok: true as const }
    }
    return {
      ok: false as const,
      error: await parseApiError(res, "Ошибка сохранения"),
    }
  }, [isEdit, subdivision, organizationId, name, onOpenChange, onSaved])

  const { loading, error, submit } = useCrudSubmit(submitFn)

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Редактировать подразделение" : "Новое подразделение"}
      submitLabel={isEdit ? "Сохранить" : "Добавить"}
      onSubmit={submit}
      loading={loading}
      error={error}
      disabled={!name.trim()}
      formKey={isEdit ? `sub-${subdivision.id}` : "sub-create"}
      size="sm"
    >
      <Field>
        <FieldLabel htmlFor="sub-name">Название</FieldLabel>
        <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
    </FormDialog>
  )
}

export function SubdivisionDialog({
  organizationId,
  subdivision,
  open,
  onOpenChange,
  onSaved,
}: SubdivisionDialogProps) {
  return (
    <SubdivisionForm
      key={`${subdivision?.id ?? "create"}-${open}`}
      organizationId={organizationId}
      subdivision={subdivision}
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />
  )
}
