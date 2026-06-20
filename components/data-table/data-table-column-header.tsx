"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { Button } from "@/components/ui/button"
import { TableHeaderText } from "@/lib/data-table/header-text"
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
    return <TableHeaderText text={title} className={className} />
  }

  const hasControls = canSort || showFaceted

  return (
    <div
      className={cn(
        "flex min-w-0 w-full max-w-full items-center gap-0.5 overflow-hidden",
        className
      )}
    >
      <TableHeaderText
        text={title}
        className={cn(
          "min-w-0 flex-1",
          hasControls && "max-sm:sr-only max-sm:w-0 max-sm:flex-none"
        )}
      />
      <div className="flex shrink-0 items-center">
        {canSort && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 max-sm:size-6"
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
