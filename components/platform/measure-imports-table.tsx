"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { useResourceDelete } from "@/hooks/use-resource-delete"
import { colMeta, actionsColumnMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TextCell } from "@/lib/data-table/text-cell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ExternalLink, Plus, Trash2 } from "lucide-react"

export type MeasureImportRow = {
  id: number
  kind: "LETTER" | "APPENDIX"
  status: "UPLOADED" | "PARSED" | "IMPORTED" | "FAILED"
  uploadedVia: "MANUAL" | "EMAIL"
  documentNumber: string | null
  originalName: string
  title: string | null
  reportDueAt: string | null
  createdAt: string
  _count: { items: number; measures: number; orders: number }
}

const STATUS_LABELS: Record<MeasureImportRow["status"], string> = {
  UPLOADED: "Загружен",
  PARSED: "Разобран",
  IMPORTED: "Импортирован",
  FAILED: "Ошибка",
}

const KIND_LABELS: Record<MeasureImportRow["kind"], string> = {
  LETTER: "Письмо",
  APPENDIX: "Приложение",
}

export function MeasureImportsTable({
  initialImports,
}: {
  initialImports: MeasureImportRow[]
}) {
  const [imports, setImports] = useState(initialImports)
  const { deleteId, deleting, requestDelete, confirmDelete, cancelDelete } =
    useResourceDelete({
      url: (id) => `/api/measure-imports/${id}`,
      onRemoved: (id) => setImports((prev) => prev.filter((row) => row.id !== id)),
      successMessage: "Документ удалён",
      errorMessage: "Не удалось удалить документ",
    })

  const deletingRecord =
    deleteId != null ? imports.find((row) => row.id === deleteId) : null

  const columns = useMemo<ColumnDef<MeasureImportRow>[]>(
    () => [
      {
        accessorKey: "documentNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Номер" />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.documentNumber ?? "—"}
            href={`/panel/measures/imports/${row.original.id}`}
            linkClassName="font-mono text-sm"
          />
        ),
        meta: colMeta("Номер", { cellClassName: "w-28 font-mono" }),
      },
      {
        id: "document",
        accessorFn: (row) => row.title ?? row.originalName,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Документ" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <TextCell
              text={row.original.title ?? row.original.originalName}
              href={`/panel/measures/imports/${row.original.id}`}
            />
            {row.original.title ? (
              <p
                className="truncate text-xs text-muted-foreground"
                title={row.original.originalName}
              >
                {row.original.originalName}
              </p>
            ) : null}
            {row.original.uploadedVia === "EMAIL" && (
              <Badge variant="outline" className="mt-1">
                Из почты
              </Badge>
            )}
          </div>
        ),
        meta: textColumnMeta("Документ", "w-[28%]"),
      },
      {
        accessorKey: "kind",
        header: "Тип",
        cell: ({ row }) => (
          <Badge variant="outline">{KIND_LABELS[row.original.kind]}</Badge>
        ),
        meta: colMeta("Тип", { cellClassName: "w-28", valueLabels: KIND_LABELS }),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "FAILED" ? "destructive" : "secondary"}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
        meta: colMeta("Статус", { cellClassName: "w-32", valueLabels: STATUS_LABELS }),
      },
      {
        id: "counts",
        header: "Меры",
        accessorFn: (row) => row._count.measures || row._count.items,
        cell: ({ row }) => {
          const { items, measures } = row.original._count
          return measures > 0 ? `${measures} в каталоге` : `${items} в preview`
        },
        meta: colMeta("Меры", { cellClassName: "w-32", faceted: false }),
      },
      {
        accessorKey: "reportDueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Срок отчёта" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) =>
          row.original.reportDueAt
            ? format(new Date(row.original.reportDueAt), "dd.MM.yyyy")
            : "—",
        meta: colMeta("Срок отчёта", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Загружен" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
        meta: colMeta("Загружен", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        meta: actionsColumnMeta(),
        cell: ({ row }) => (
          <TableRowActions
            actions={[
              {
                label: "Открыть",
                icon: <ExternalLink data-icon="inline-start" />,
                href: `/panel/measures/imports/${row.original.id}`,
              },
              {
                label: "Удалить",
                icon: <Trash2 data-icon="inline-start" />,
                destructive: true,
                onClick: () => requestDelete(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    [requestDelete]
  )

  const deleteDescription =
    deletingRecord?.status === "IMPORTED"
      ? "Документ будет удалён. Меры, уже добавленные в каталог, останутся."
      : deletingRecord && deletingRecord._count.orders > 0
        ? "Документ будет удалён. Связанные поручения сохранятся, ссылка на импорт будет снята."
        : "Документ и файл DOCX будут удалены без возможности восстановления."

  return (
    <>
      <DataTable
        columns={columns}
        data={imports}
        searchPlaceholder="Поиск по номеру, названию, файлу…"
        initialSorting={[{ id: "createdAt", desc: true }]}
        hideOnMobileColumnIds={["counts", "reportDueAt"]}
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [
            row.documentNumber ?? "",
            row.title ?? "",
            row.originalName,
            KIND_LABELS[row.kind],
            STATUS_LABELS[row.status],
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        empty={
          <EmptyTableState
            title="Нет загруженных документов"
            description="Загрузите письмо или приложение ФСТЭК в формате DOCX"
          >
            <Button size="sm" asChild>
              <Link href="/panel/measures/imports/new">
                <Plus data-icon="inline-start" />
                Загрузить документ
              </Link>
            </Button>
          </EmptyTableState>
        }
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(open) => !open && cancelDelete()}
        title="Удалить документ?"
        description={deleteDescription}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  )
}
