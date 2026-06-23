"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  MeasureImportDetailHeader,
  type ImportHeaderRecord,
} from "@/components/platform/measure-import-detail-header"
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
import { Plus } from "lucide-react"

type ImportItem = {
  id: number
  code: string | null
  name: string
  description: string | null
  tags: string[]
  included: boolean
  measureId: number | null
}

type ImportDetail = ImportHeaderRecord & {
  needsAppendix?: boolean
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
  const [saving, setSaving] = useState(false)
  const [committing, setCommitting] = useState(false)

  const includedCount = items.filter((item) => item.included).length

  function handleRecordChange(next: ImportHeaderRecord) {
    setRecord((prev) => ({ ...prev, ...next }))
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
    setRecord((prev) => ({ ...prev, ...data, items: data.items }))
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
    setRecord((prev) => ({ ...prev, ...data, items: data.items }))
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
    setRecord((prev) => ({ ...prev, ...data.record, items: data.record.items }))
    setItems(data.record.items)
  }

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
        accessorKey: "tags",
        header: "Теги",
        meta: colMeta("Теги", {
          faceted: false,
          cellClassName: "w-32 min-w-32 max-w-32 align-top",
        }),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.tags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
          </div>
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
      <MeasureImportDetailHeader record={record} onRecordChange={handleRecordChange} />

      {record.needsAppendix && items.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Письмо ссылается на приложение с мерами. Загрузите файл «Приложение …docx» и
          привяжите его к этому импорту.
        </div>
      )}

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
    </div>
  )
}
