"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  type Table as TanstackTable,
  type Updater,
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
import { buildVisibleColumnWidths, stripPercentWidthClass } from "@/lib/data-table/column-width"
import { wrapTableHeaderContent } from "@/lib/data-table/header-text"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import {
  clampColumnVisibility,
  getColumnDefIds,
} from "@/lib/data-table/column-visibility"
import { cn } from "@/lib/utils"

function getColumnCellClassName(
  columnId: string,
  meta: ColumnDef<unknown, unknown>["meta"]
) {
  return cn(
    stripPercentWidthClass(meta?.cellClassName),
    isActionsColumn(columnId, meta) && ACTIONS_COLUMN_CELL_CLASS
  )
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder,
  globalFilterFn,
  filters,
  renderFilters,
  pageSize = 20,
  empty,
  showColumnToggle = true,
  showPagination = true,
  className,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  hideOnMobileColumnIds,
  initialSorting,
  onRowClick,
  getRowClassName,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchPlaceholder?: string
  globalFilterFn?: (row: TData, _columnId: string, filterValue: string) => boolean
  filters?: React.ReactNode
  renderFilters?: (table: TanstackTable<TData>) => React.ReactNode
  pageSize?: number
  empty?: React.ReactNode
  showColumnToggle?: boolean
  showPagination?: boolean
  className?: string
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  /** Column ids hidden below the `sm` breakpoint (filters still apply). */
  hideOnMobileColumnIds?: string[]
  initialSorting?: SortingState
  onRowClick?: (row: TData) => void
  getRowClassName?: (row: TData) => string | undefined
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])

  const columnFilters = controlledColumnFilters ?? internalColumnFilters
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters

  const columnIds = useMemo(() => getColumnDefIds(columns), [columns])

  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        return clampColumnVisibility(columnIds, prev, next)
      })
    },
    [columnIds]
  )

  useEffect(() => {
    if (!hideOnMobileColumnIds?.length) return

    const media = window.matchMedia("(max-width: 639px)")
    const sync = () => {
      const compact = media.matches
      setColumnVisibility((prev) => {
        const next = { ...prev }
        for (const id of hideOnMobileColumnIds) {
          next[id] = !compact
        }
        return clampColumnVisibility(columnIds, prev, next)
      })
    }

    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [hideOnMobileColumnIds, columnIds])

  const table = useReactTable({
    data,
    columns,
    defaultColumn: { filterFn: facetedFilter },
    state: { sorting, columnVisibility, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onColumnVisibilityChange: handleColumnVisibilityChange,
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
    searchPlaceholder || filters || renderFilters || showColumnToggle || hasActiveFilters
  const toolbarFilters = renderFilters ? renderFilters(table) : filters

  const columnWidths = useMemo(() => {
    const headers =
      table.getHeaderGroups()[0]?.headers.filter((header) => header.column.getIsVisible()) ??
      []

    return buildVisibleColumnWidths(
      headers.map((header) => ({
        id: header.column.id,
        meta: header.column.columnDef.meta,
      }))
    )
  }, [table, columnVisibility])

  const visibleHeaders =
    table.getHeaderGroups()[0]?.headers.filter((header) => header.column.getIsVisible()) ??
    []

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
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {hasToolbar && (
        <div className="flex min-w-0 flex-col gap-2 overflow-x-hidden">
          <DataTableToolbar
            table={table}
            searchPlaceholder={searchPlaceholder}
            filters={toolbarFilters}
            showColumnToggle={showColumnToggle}
          />
          <DataTableActiveFilters table={table} />
        </div>
      )}
      <div className="rounded-md border">
        <Table className="w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            {visibleHeaders.map((header) => (
              <col
                key={header.id}
                style={{ width: columnWidths.get(header.column.id) }}
              />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter((header) => header.column.getIsVisible())
                  .map((header) => {
                  const meta = header.column.columnDef.meta
                  const actions = isActionsColumn(header.column.id, meta)
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        getColumnCellClassName(header.column.id, meta),
                        !actions && "overflow-hidden"
                      )}
                      style={{ width: columnWidths.get(header.column.id) }}
                    >
                      {header.isPlaceholder
                        ? null
                        : wrapTableHeaderContent(
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell colSpan={visibleHeaders.length || columns.length} className="h-24">
                  {empty ?? defaultEmpty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    getRowClassName?.(row.original)
                  )}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
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
                        className={cn(
                          getColumnCellClassName(cell.column.id, meta),
                          !actions && "overflow-hidden"
                        )}
                        style={{ width: columnWidths.get(cell.column.id) }}
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
