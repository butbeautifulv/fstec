"use client"

import { useCallback, useMemo } from "react"
import type { ColumnDef, Table } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { OrderCreateMeasure } from "@/components/platform/order-create-draft"
import { colMeta } from "@/lib/data-table/column-meta"
import { createCodeColumn } from "@/lib/data-table/columns"
import { dateSortFn } from "@/lib/data-table/sort-helpers"

type MeasureSelectTableProps = {
  measures: OrderCreateMeasure[]
  selectedIds: Set<number>
  onSelectionChange: (next: Set<number>) => void
}

function selectAllFiltered(
  table: Table<OrderCreateMeasure>,
  selectedIds: Set<number>,
  onSelectionChange: (next: Set<number>) => void
) {
  const next = new Set(selectedIds)
  for (const row of table.getFilteredRowModel().rows) {
    next.add(row.original.id)
  }
  onSelectionChange(next)
}

export function MeasureSelectTable({
  measures,
  selectedIds,
  onSelectionChange,
}: MeasureSelectTableProps) {
  const toggleId = useCallback(
    (id: number) => {
      const next = new Set(selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onSelectionChange(next)
    },
    [selectedIds, onSelectionChange]
  )

  const columns = useMemo<ColumnDef<OrderCreateMeasure>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const pageRows = table.getRowModel().rows
          const pageIds = pageRows.map((row) => row.original.id)
          const allPageSelected =
            pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
          const somePageSelected = pageIds.some((id) => selectedIds.has(id))

          return (
            <Checkbox
              checked={
                allPageSelected ? true : somePageSelected ? "indeterminate" : false
              }
              onCheckedChange={(checked) => {
                const next = new Set(selectedIds)
                if (checked === true) {
                  for (const id of pageIds) next.add(id)
                } else {
                  for (const id of pageIds) next.delete(id)
                }
                onSelectionChange(next)
              }}
              aria-label="Выбрать все на странице"
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleId(row.original.id)}
            aria-label={`Выбрать ${row.original.name}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: colMeta("", { cellClassName: "w-10" }),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Название" />
        ),
        meta: colMeta("Название"),
      },
      createCodeColumn((row) => row.code),
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Создана" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
        meta: colMeta("Создана", { valueType: "date" }),
      },
    ],
    [selectedIds, onSelectionChange, toggleId]
  )

  return (
    <DataTable
      columns={columns}
      data={measures}
      searchPlaceholder="Поиск по названию или коду…"
      showColumnToggle={false}
      initialSorting={[{ id: "createdAt", desc: true }]}
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return [row.name, row.code ?? ""].join(" ").toLowerCase().includes(q)
      }}
      empty={
        <p className="text-center text-sm text-muted-foreground">Меры не найдены</p>
      }
      onRowClick={(row) => toggleId(row.id)}
      getRowClassName={(row) =>
        selectedIds.has(row.id) ? "bg-muted/50" : undefined
      }
      renderFilters={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => selectAllFiltered(table, selectedIds, onSelectionChange)}
          >
            Выбрать все по фильтру
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onSelectionChange(new Set())}
          >
            Снять все
          </Button>
          <span className="text-xs text-muted-foreground">
            Выбрано: {selectedIds.size}
          </span>
        </div>
      )}
    />
  )
}
