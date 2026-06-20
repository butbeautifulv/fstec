"use client"

import { useCallback, useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/data-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { colMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { cn } from "@/lib/utils"
import type { OrderCreateMeasure } from "@/components/platform/order-create-draft"

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
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }])
  const [globalFilter, setGlobalFilter] = useState("")

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
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.code ?? "—"}
          </span>
        ),
        meta: colMeta("Код"),
      },
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

  const table = useReactTable({
    data: measures,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase()
      if (!q) return true
      const m = row.original
      return [m.name, m.code ?? ""].join(" ").toLowerCase().includes(q)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  function selectAllFiltered() {
    const next = new Set(selectedIds)
    for (const row of table.getFilteredRowModel().rows) {
      next.add(row.original.id)
    }
    onSelectionChange(next)
  }

  function clearSelection() {
    onSelectionChange(new Set())
  }

  const isEmpty = table.getRowModel().rows.length === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <DataTableToolbar
          table={table}
          searchPlaceholder="Поиск по названию или коду…"
          showColumnToggle={false}
          filters={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={selectAllFiltered}>
                Выбрать все по фильтру
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                Снять все
              </Button>
              <span className="text-xs text-muted-foreground">
                Выбрано: {selectedIds.size}
              </span>
            </div>
          }
        />
      </div>
      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.cellClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Меры не найдены
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "cursor-pointer",
                    selectedIds.has(row.original.id) && "bg-muted/50"
                  )}
                  onClick={() => toggleId(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isEmpty && <DataTablePagination table={table} />}
      </div>
    </div>
  )
}
