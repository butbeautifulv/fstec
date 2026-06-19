"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { cn } from "@/lib/utils"

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort()
  const canFilter = column.getCanFilter()
  const showFaceted = canFilter && column.columnDef.meta?.faceted !== false

  if (!canSort && !showFaceted) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="truncate">{title}</span>
      <div className="flex items-center">
        {canSort && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="size-3.5" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="size-3.5" />
            ) : (
              <ChevronsUpDownIcon className="size-3.5" />
            )}
            <span className="sr-only">Сортировка</span>
          </Button>
        )}
        {showFaceted && <DataTableFacetedFilter column={column} title={title} />}
      </div>
    </div>
  )
}
