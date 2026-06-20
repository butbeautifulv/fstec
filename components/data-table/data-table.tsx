"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { DataTableActiveFilters } from "@/components/data-table/data-table-active-filters"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ACTIONS_COLUMN_CELL_CLASS,
  isActionsColumn,
} from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { cn } from "@/lib/utils"

function getColumnCellClassName(
  columnId: string,
  meta: ColumnDef<unknown, unknown>["meta"]
) {
  return cn(
    meta?.cellClassName,
    isActionsColumn(columnId, meta) && ACTIONS_COLUMN_CELL_CLASS
  )
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder,
  globalFilterFn,
  filters,
  pageSize = 20,
  empty,
  showColumnToggle = true,
  showPagination = true,
  className,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchPlaceholder?: string
  globalFilterFn?: (row: TData, _columnId: string, filterValue: string) => boolean
  filters?: React.ReactNode
  pageSize?: number
  empty?: React.ReactNode
  showColumnToggle?: boolean
  showPagination?: boolean
  className?: string
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])

  const columnFilters = controlledColumnFilters ?? internalColumnFilters
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters

  const table = useReactTable({
    data,
    columns,
    defaultColumn: { filterFn: facetedFilter },
    state: { sorting, columnVisibility, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater
      setColumnFilters(next)
    },
    globalFilterFn: globalFilterFn
      ? (row, columnId, filterValue) =>
          globalFilterFn(row.original, columnId, filterValue)
      : "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  })

  const hasActiveFilters = columnFilters.length > 0
  const isEmpty = table.getRowModel().rows.length === 0
  const hasToolbar =
    searchPlaceholder || filters || showColumnToggle || hasActiveFilters

  const defaultEmpty = (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-sm text-muted-foreground">
        {hasActiveFilters ? "Нет строк по текущим фильтрам" : "Нет данных"}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={() => table.resetColumnFilters()}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {hasToolbar && (
        <div className="flex flex-col gap-2">
          <DataTableToolbar
            table={table}
            searchPlaceholder={searchPlaceholder}
            filters={filters}
            showColumnToggle={showColumnToggle}
          />
          <DataTableActiveFilters table={table} />
        </div>
      )}
      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  return (
                    <TableHead
                      key={header.id}
                      className={getColumnCellClassName(header.column.id, meta)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  {empty ?? defaultEmpty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    const actions = isActionsColumn(cell.column.id, meta)
                    const content = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )
                    return (
                      <TableCell
                        key={cell.id}
                        className={getColumnCellClassName(cell.column.id, meta)}
                      >
                        {actions ? (
                          <div className="flex items-center justify-center">{content}</div>
                        ) : (
                          content
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {showPagination && !isEmpty && (
          <DataTablePagination table={table} />
        )}
      </div>
    </div>
  )
}
