"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { Download, RefreshCw, Trash2 } from "lucide-react"

type ImportHeaderRecord = {
  id: number
  kind: "LETTER" | "APPENDIX"
  status: "UPLOADED" | "PARSED" | "IMPORTED" | "FAILED"
  documentNumber: string | null
  title: string | null
  reportDueAt: string | null
  originalName: string
  parseError: string | null
  ordersCount: number
}

export function MeasureImportDetailHeader({
  record,
  onRecordChange,
}: {
  record: ImportHeaderRecord
  onRecordChange: (next: ImportHeaderRecord) => void
}) {
  const router = useRouter()
  const [parsing, setParsing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleParse() {
    setParsing(true)
    const res = await fetch(`/api/measure-imports/${record.id}/parse`, { method: "POST" })
    setParsing(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось разобрать документ")
      return
    }
    const data = await res.json()
    onRecordChange({
      ...record,
      kind: data.kind,
      status: data.status,
      title: data.title,
      reportDueAt: data.reportDueAt,
      parseError: data.parseError,
    })
    notify.success("Документ разобран")
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/measure-imports/${record.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось удалить документ")
      return
    }
    notify.success("Документ удалён")
    router.push("/panel/measures/imports")
    router.refresh()
  }

  const deleteDescription =
    record.status === "IMPORTED"
      ? "Документ будет удалён. Меры, уже добавленные в каталог, останутся."
      : record.ordersCount > 0
        ? "Документ будет удалён. Связанные поручения сохранятся, ссылка на импорт будет снята."
        : "Документ и файл DOCX будут удалены без возможности восстановления."

  return (
    <>
      <PageHeader
        title={record.documentNumber ?? record.originalName}
        description={
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              <Badge>{record.kind === "LETTER" ? "Письмо" : "Приложение"}</Badge>
              <Badge variant={record.status === "FAILED" ? "destructive" : "secondary"}>
                {record.status}
              </Badge>
            </div>
            {record.title && <span>{record.title}</span>}
            {record.reportDueAt && (
              <span>Срок отчёта: {format(new Date(record.reportDueAt), "dd.MM.yyyy")}</span>
            )}
            {record.parseError && (
              <span className="text-destructive">{record.parseError}</span>
            )}
          </div>
        }
        backHref="/panel/measures/imports"
        backLabel="Письма"
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={`/api/measure-imports/${record.id}/download`}>
                <Download className="size-4" />
                Скачать DOCX
              </a>
            </Button>
            <Button variant="outline" onClick={handleParse} disabled={parsing}>
              {parsing ? <Spinner data-icon="inline-start" /> : <RefreshCw className="size-4" />}
              Разобрать снова
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 data-icon="inline-start" />
              Удалить
            </Button>
          </>
        }
      />
      <ConfirmDeleteAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить документ?"
        description={deleteDescription}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

export type { ImportHeaderRecord }
