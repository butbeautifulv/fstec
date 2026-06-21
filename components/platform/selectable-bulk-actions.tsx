"use client"

import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { selectAllFiltered } from "@/lib/data-table/selectable-table-helpers"

type SelectableBulkActionsProps<T> = {
  table: Table<T>
  selectedCount: number
  getKey: (row: T) => string | number
  selectedKeys: Set<string | number>
  onSelectionChange: (next: Set<string | number>) => void
}

export function SelectableBulkActions<T>({
  table,
  selectedCount,
  getKey,
  selectedKeys,
  onSelectionChange,
}: SelectableBulkActionsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          selectAllFiltered(table, getKey, selectedKeys, onSelectionChange)
        }
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
      <span className="text-xs text-muted-foreground">Выбрано: {selectedCount}</span>
    </div>
  )
}
