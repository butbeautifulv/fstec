"use client"

import { useMemo } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowLink,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { actionsColumnMeta, colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TextCell } from "@/lib/data-table/text-cell"
import { getDisplayStatusName, isOrderItemOverdue } from "@/lib/statuses/workflow"
import { format } from "date-fns"

export type MeasuresTableStatus = { id: number; name: string; isTerminal: boolean }

export type MeasuresTableItem = {
  id: number
  orderId?: number
  dueAt: string
  measure: { name: string; code: string | null; description?: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderTitle?: string
  subdivisionName?: string | null
}

type MeasuresRow = MeasuresTableItem & {
  isOverdue: boolean
  displayStatus: string
}

export function MeasuresDataTable({
  basePath,
  items,
  statuses,
  showSubdivisionColumn = false,
  showOrderColumn = false,
  actionLabel,
  columnFilters,
  onColumnFiltersChange,
}: {
  basePath: string
  items: MeasuresTableItem[]
  statuses: MeasuresTableStatus[]
  showSubdivisionColumn?: boolean
  showOrderColumn?: boolean
  actionLabel?: string
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  const statusById = useMemo(
    () => new Map(statuses.map((s) => [s.id, s])),
    [statuses]
  )

  const rows: MeasuresRow[] = useMemo(() => {
    const now = new Date()
    return items.map((item) => {
      const meta = statusById.get(item.status.id)
      const statusWithTerminal = {
        name: item.status.name,
        isTerminal: meta?.isTerminal ?? item.status.isTerminal ?? false,
      }
      const rowItem = { ...item, status: statusWithTerminal, dueAt: item.dueAt }
      return {
        ...item,
        isOverdue: isOrderItemOverdue(rowItem, now),
        displayStatus: getDisplayStatusName(rowItem, now),
      }
    })
  }, [items, statusById])

  const columns = useMemo<ColumnDef<MeasuresRow>[]>(() => {
    const base: ColumnDef<MeasuresRow>[] = []

    if (showOrderColumn && items.some((item) => item.orderTitle)) {
      base.push({
        id: "orderTitle",
        accessorKey: "orderTitle",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.orderTitle ?? "—"}
            href={`${basePath}/orders/${row.original.orderId}`}
          />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: textColumnMeta("Поручение", "w-[18%]"),
      })
    }

    if (showSubdivisionColumn) {
      base.push({
        id: "subdivisionName",
        accessorFn: (row) => row.subdivisionName ?? "Без подразделения",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Подразделение" />
        ),
        cell: ({ row }) => (
          <TextCell text={row.original.subdivisionName ?? "Без подразделения"} />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: textColumnMeta("Подразделение", "w-[16%]"),
      })
    }

    base.push(
      {
        id: "measure",
        header: "Мера",
        accessorFn: (row) => row.measure.name,
        cell: ({ row }) => (
          <TextCell
            text={row.original.measure.name}
            href={`${basePath}/items/${row.original.id}`}
          />
        ),
        enableColumnFilter: false,
        meta: textColumnMeta("Мера", "min-w-[10rem] w-[28%]", { faceted: false }),
      },
      {
        id: "code",
        header: "Код",
        accessorFn: (row) => row.measure.code ?? "—",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.measure.code ?? "—"}
          </span>
        ),
        enableColumnFilter: false,
        meta: colMeta("Код", { faceted: false, cellClassName: "w-24" }),
      },
      {
        accessorKey: "dueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.dueAt), "dd.MM.yyyy"),
        meta: colMeta("Срок", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        id: "status",
        accessorFn: (row) => row.displayStatus,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isOverdue ? "destructive" : "secondary"}>
            {row.original.displayStatus}
          </Badge>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Статус", { cellClassName: "w-32" }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <DataTableRowLink
            href={`${basePath}/items/${row.original.id}`}
            label={actionLabel}
          />
        ),
        meta: actionsColumnMeta(),
      }
    )

    return base
  }, [basePath, showSubdivisionColumn, showOrderColumn, actionLabel, items])

  const hideOnMobileColumnIds = useMemo(() => {
    const ids: string[] = []
    if (showSubdivisionColumn) ids.push("subdivisionName")
    if (showOrderColumn) ids.push("orderTitle")
    return ids.length > 0 ? ids : undefined
  }, [showSubdivisionColumn, showOrderColumn])

  return (
    <DataTable
      columns={columns}
      data={rows}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      hideOnMobileColumnIds={hideOnMobileColumnIds}
      searchPlaceholder={
        showOrderColumn
          ? "Поиск по мере, коду, поручению…"
          : "Поиск по мере, коду…"
      }
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return [
          row.measure.name,
          row.measure.code ?? "",
          row.orderTitle ?? "",
          row.subdivisionName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }}
      empty={
        <p className="py-8 text-center text-sm text-muted-foreground">Меры не найдены</p>
      }
    />
  )
}
