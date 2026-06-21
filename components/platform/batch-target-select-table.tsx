"use client"

import { useCallback, useMemo } from "react"
import type { ColumnDef, Table } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import {
  selectableTargetKey,
  type SelectableBatchTargetRow,
} from "@/lib/orders/batch-targets"

type BatchTargetSelectTableProps = {
  targets: SelectableBatchTargetRow[]
  selectedKeys: Set<string>
  onSelectionChange: (next: Set<string>) => void
}

function selectAllFiltered(
  table: Table<SelectableBatchTargetRow>,
  selectedKeys: Set<string>,
  onSelectionChange: (next: Set<string>) => void
) {
  const next = new Set(selectedKeys)
  for (const row of table.getFilteredRowModel().rows) {
    next.add(selectableTargetKey(row.original))
  }
  onSelectionChange(next)
}

export function BatchTargetSelectTable({
  targets,
  selectedKeys,
  onSelectionChange,
}: BatchTargetSelectTableProps) {
  const toggleKey = useCallback(
    (key: string) => {
      const next = new Set(selectedKeys)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onSelectionChange(next)
    },
    [selectedKeys, onSelectionChange]
  )

  const columns = useMemo<ColumnDef<SelectableBatchTargetRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const pageRows = table.getRowModel().rows
          const pageKeys = pageRows.map((row) => selectableTargetKey(row.original))
          const allPageSelected =
            pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.has(key))
          const somePageSelected = pageKeys.some((key) => selectedKeys.has(key))

          return (
            <Checkbox
              checked={
                allPageSelected ? true : somePageSelected ? "indeterminate" : false
              }
              onCheckedChange={(checked) => {
                const next = new Set(selectedKeys)
                if (checked === true) {
                  for (const key of pageKeys) next.add(key)
                } else {
                  for (const key of pageKeys) next.delete(key)
                }
                onSelectionChange(next)
              }}
              aria-label="Выбрать все на странице"
            />
          )
        },
        cell: ({ row }) => {
          const key = selectableTargetKey(row.original)
          return (
            <Checkbox
              checked={selectedKeys.has(key)}
              onCheckedChange={() => toggleKey(key)}
              aria-label={`Выбрать ${row.original.organizationName}`}
              onClick={(e) => e.stopPropagation()}
            />
          )
        },
        enableSorting: false,
        enableHiding: false,
        meta: colMeta("", { cellClassName: "w-10" }),
      },
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Организация" />
        ),
        meta: textColumnMeta("Организация", "w-[45%]"),
      },
      {
        id: "subdivisionName",
        accessorFn: (row) => row.subdivisionName ?? "—",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Подразделение" />
        ),
        cell: ({ row }) => row.original.subdivisionName ?? "—",
        meta: colMeta("Подразделение", { cellClassName: "w-[35%]" }),
      },
    ],
    [selectedKeys, onSelectionChange, toggleKey]
  )

  return (
    <DataTable
      columns={columns}
      data={targets}
      searchPlaceholder="Поиск по организации или подразделению…"
      showColumnToggle={false}
      initialSorting={[{ id: "organizationName", desc: false }]}
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return [row.organizationName, row.subdivisionName ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }}
      empty={
        <p className="text-center text-sm text-muted-foreground">
          Подведомственные организации не найдены
        </p>
      }
      onRowClick={(row) => toggleKey(selectableTargetKey(row))}
      getRowClassName={(row) =>
        selectedKeys.has(selectableTargetKey(row)) ? "bg-muted/50" : undefined
      }
      renderFilters={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => selectAllFiltered(table, selectedKeys, onSelectionChange)}
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
            Выбрано: {selectedKeys.size}
          </span>
        </div>
      )}
    />
  )
}
