"use client"

import type { Table } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import { useTimezone } from "@/components/timezone-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatFilterDisplayValue } from "@/lib/data-table/format-filter-value"

export function DataTableActiveFilters<TData>({ table }: { table: Table<TData> }) {
  const { timeZone } = useTimezone()
  const columnFilters = table.getState().columnFilters
  if (columnFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {columnFilters.map((filter) => {
        const column = table.getColumn(filter.id)
        const meta = column?.columnDef.meta
        const title = meta?.title ?? filter.id
        const values = (filter.value as string[]) ?? []

        return values.map((value) => (
          <Badge key={`${filter.id}-${value}`} variant="secondary" className="gap-1 pr-1">
            {title}: {formatFilterDisplayValue(value, meta, timeZone)}
            <button
              type="button"
              className="rounded-sm hover:bg-muted"
              onClick={() => {
                const next = values.filter((v) => v !== value)
                column?.setFilterValue(next.length ? next : undefined)
              }}
            >
              <XIcon className="size-3" />
              <span className="sr-only">Убрать фильтр</span>
            </button>
          </Badge>
        ))
      })}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => table.resetColumnFilters()}
      >
        Сбросить все
      </Button>
    </div>
  )
}
