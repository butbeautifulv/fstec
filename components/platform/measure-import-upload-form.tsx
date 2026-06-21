"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { FormCardGrid } from "@/components/shared/form-card-grid"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"
import { Upload } from "lucide-react"

type ParentOption = { id: number; label: string }

export function MeasureImportUploadForm({
  parentOptions = [],
}: {
  parentOptions?: ParentOption[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parentImportId, setParentImportId] = useState<string>("none")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    if (parentImportId !== "none") {
      formData.append("parentImportId", parentImportId)
    }

    const res = await fetch("/api/measure-imports", {
      method: "POST",
      body: formData,
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось загрузить файл")
      return
    }

    const record = await res.json()
    notify.success("Документ загружен")

    const parseRes = await fetch(`/api/measure-imports/${record.id}/parse`, {
      method: "POST",
    })
    if (!parseRes.ok) {
      notify.error("Файл загружен, но разбор не удался — откройте документ для ручной правки")
      router.push(`/panel/measures/imports/${record.id}`)
      router.refresh()
      return
    }

    notify.success("Меры извлечены из документа")
    router.push(`/panel/measures/imports/${record.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormCardGrid singleCard>
        <Card>
          <CardHeader>
            <CardTitle>Файл DOCX</CardTitle>
            <CardDescription>
              Письмо или приложение ФСТЭК в формате .docx (до 20 МБ)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {parentOptions.length > 0 && (
                <Field>
                  <FieldLabel>Приложение к письму</FieldLabel>
                  <Select value={parentImportId} onValueChange={setParentImportId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите письмо" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Новое письмо</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel>Документ</FieldLabel>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {file ? file.name : "Выбрать файл .docx"}
                </Button>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </FormCardGrid>

      <FormActionsBar>
        <Button type="submit" disabled={!file || loading}>
          {loading && <Spinner data-icon="inline-start" />}
          Загрузить и разобрать
        </Button>
      </FormActionsBar>
    </form>
  )
}
