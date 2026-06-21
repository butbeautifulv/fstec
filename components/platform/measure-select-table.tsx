"use client"

import { useCallback, useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { SelectableBulkActions } from "@/components/platform/selectable-bulk-actions"
import { toggleInSet } from "@/lib/data-table/selectable-table-helpers"
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

export function MeasureSelectTable({
  measures,
  selectedIds,
  onSelectionChange,
}: MeasureSelectTableProps) {
  const toggleId = useCallback(
    (id: number) => {
      onSelectionChange(toggleInSet(selectedIds, id))
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
        <SelectableBulkActions
          table={table}
          selectedCount={selectedIds.size}
          getKey={(row) => row.id}
          selectedKeys={selectedIds}
          onSelectionChange={(next) => onSelectionChange(next as Set<number>)}
        />
      )}
    />
  )
}
