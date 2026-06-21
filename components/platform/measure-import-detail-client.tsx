"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { DataTable } from "@/components/data-table"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { colMeta } from "@/lib/data-table/column-meta"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react"

type ImportItem = {
  id: number
  code: string | null
  name: string
  description: string | null
  included: boolean
  measureId: number | null
}

type ImportDetail = {
  id: number
  kind: "LETTER" | "APPENDIX"
  status: "UPLOADED" | "PARSED" | "IMPORTED" | "FAILED"
  documentNumber: string | null
  title: string | null
  reportDueAt: string | null
  originalName: string
  parseError: string | null
  ordersCount: number
  items: ImportItem[]
}

export function MeasureImportDetailClient({
  initialImport,
}: {
  initialImport: ImportDetail
}) {
  const router = useRouter()
  const [record, setRecord] = useState(initialImport)
  const [items, setItems] = useState(initialImport.items)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const includedCount = items.filter((item) => item.included).length

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
    setRecord(data)
    setItems(data.items)
    notify.success("Документ разобран")
    router.refresh()
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/measure-imports/${record.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          included: item.included,
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось сохранить")
      return
    }
    const data = await res.json()
    setRecord(data)
    setItems(data.items)
    notify.success("Изменения сохранены")
  }

  async function handleCommit() {
    setCommitting(true)
    await handleSave()
    const res = await fetch(`/api/measure-imports/${record.id}/commit`, { method: "POST" })
    setCommitting(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось импортировать")
      return
    }
    const data = await res.json()
    setRecord(data)
    setItems(data.items)
    notify.success("Меры добавлены в каталог")
    router.push(`/panel/orders/new?importId=${record.id}`)
    router.refresh()
  }

  async function handleAddItem() {
    const res = await fetch(`/api/measure-imports/${record.id}/items`, { method: "POST" })
    if (!res.ok) {
      notify.error("Не удалось добавить строку")
      return
    }
    const data = await res.json()
    setRecord(data.record)
    setItems(data.record.items)
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

  const showCatalog = items.some((item) => item.measureId != null)

  const columns = useMemo<ColumnDef<ImportItem>[]>(
    () => [
      {
        id: "included",
        header: "",
        meta: colMeta("", { faceted: false, cellClassName: "w-10 min-w-10 max-w-10 px-1 align-top" }),
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.included}
            className="mt-2"
            onCheckedChange={(checked) => {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === row.original.id
                    ? { ...item, included: checked === true }
                    : item
                )
              )
            }}
          />
        ),
      },
      {
        accessorKey: "code",
        header: "Код",
        meta: colMeta("Код", {
          faceted: false,
          cellClassName: "w-28 min-w-28 max-w-28 align-top whitespace-normal",
        }),
        cell: ({ row }) => (
          <Input
            value={row.original.code ?? ""}
            className="h-8 w-full min-w-0 font-mono text-xs"
            onChange={(e) => {
              const value = e.target.value
              setItems((prev) =>
                prev.map((item) =>
                  item.id === row.original.id ? { ...item, code: value || null } : item
                )
              )
            }}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Название",
        meta: colMeta("Название", {
          faceted: false,
          cellClassName: "w-48 min-w-48 max-w-48 align-top whitespace-normal",
        }),
        cell: ({ row }) => (
          <Input
            value={row.original.name}
            className="h-8 w-full min-w-0 text-xs"
            title={row.original.name}
            onChange={(e) => {
              const value = e.target.value
              setItems((prev) =>
                prev.map((item) =>
                  item.id === row.original.id ? { ...item, name: value } : item
                )
              )
            }}
          />
        ),
      },
      {
        accessorKey: "description",
        header: "Мера",
        meta: colMeta("Мера", {
          faceted: false,
          cellClassName: "w-[100%] align-top whitespace-normal",
        }),
        cell: ({ row }) => (
          <Textarea
            value={row.original.description ?? ""}
            rows={5}
            className="min-h-24 w-full min-w-0 text-sm"
            placeholder="Текст меры из письма…"
            onChange={(e) => {
              const value = e.target.value
              setItems((prev) =>
                prev.map((item) =>
                  item.id === row.original.id
                    ? { ...item, description: value || null }
                    : item
                )
              )
            }}
          />
        ),
      },
      ...(showCatalog
        ? ([
            {
              id: "catalog",
              header: "Кат.",
              meta: colMeta("Каталог", {
                faceted: false,
                cellClassName: "w-12 min-w-12 max-w-12 text-center text-xs align-top",
              }),
              cell: ({ row }) =>
                row.original.measureId ? (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {row.original.measureId}
                  </Badge>
                ) : (
                  "—"
                ),
            },
          ] satisfies ColumnDef<ImportItem>[])
        : []),
    ],
    [showCatalog]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge>{record.kind === "LETTER" ? "Письмо" : "Приложение"}</Badge>
            <Badge variant={record.status === "FAILED" ? "destructive" : "secondary"}>
              {record.status}
            </Badge>
          </div>
          {record.title && <p className="text-sm text-muted-foreground">{record.title}</p>}
          {record.reportDueAt && (
            <p className="text-sm">
              Срок отчёта: {format(new Date(record.reportDueAt), "dd.MM.yyyy")}
            </p>
          )}
          {record.parseError && (
            <p className="text-sm text-destructive">{record.parseError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Меры не найдены. Нажмите «Разобрать снова» или добавьте строки вручную.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          showColumnToggle={false}
          showPagination={items.length > 20}
        />
      )}

      <FormActionsBar>
        <Button type="button" variant="outline" onClick={handleAddItem}>
          <Plus className="size-4" />
          Добавить строку
        </Button>
        <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          Сохранить preview
        </Button>
        <Button type="button" onClick={handleCommit} disabled={committing || includedCount === 0}>
          {committing && <Spinner data-icon="inline-start" />}
          Импортировать {includedCount} мер
        </Button>
        {record.status === "IMPORTED" && (
          <Button variant="secondary" asChild>
            <Link href={`/panel/orders/new?importId=${record.id}`}>Создать поручения</Link>
          </Button>
        )}
      </FormActionsBar>

      <ConfirmDeleteAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить документ?"
        description={deleteDescription}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
