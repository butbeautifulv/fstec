"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { facetedFilter, FACETED_COLUMN_META } from "@/lib/data-table/faceted-column"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { getDisplayStatusName, isOrderItemOverdue } from "@/lib/statuses/workflow"
import { format } from "date-fns"

export type PublicStatus = { id: number; name: string; isTerminal: boolean }

export type PublicItem = {
  id: number
  dueAt: string
  measure: { name: string; code: string | null; description: string | null }
  status: { id: number; name: string; isTerminal?: boolean }
  orderTitle: string
  orderIssuedAt: string
  subdivisionName?: string | null
}

type Row = PublicItem & {
  isOverdue: boolean
  displayStatus: string
}

export function PublicMeasuresTable({
  token,
  items,
  statuses,
  showSubdivisionColumn = false,
  columnFilters,
  onColumnFiltersChange,
}: {
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  const statusById = useMemo(
    () => new Map(statuses.map((s) => [s.id, s])),
    [statuses]
  )

  const rows: Row[] = useMemo(() => {
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

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const base: ColumnDef<Row>[] = [
      {
        id: "orderTitle",
        accessorKey: "orderTitle",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: { ...FACETED_COLUMN_META, title: "Поручение" },
      },
    ]

    if (showSubdivisionColumn) {
      base.push({
        id: "subdivisionName",
        accessorFn: (row) => row.subdivisionName ?? "Без подразделения",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Подразделение" />
        ),
        cell: ({ row }) => row.original.subdivisionName ?? "Без подразделения",
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: { ...FACETED_COLUMN_META, title: "Подразделение" },
      })
    }

    base.push(
      {
        id: "measure",
        header: "Мера",
        accessorFn: (row) => row.measure.name,
        cell: ({ row }) => row.original.measure.name,
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
      },
      {
        accessorKey: "dueAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Срок" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.dueAt), "dd.MM.yyyy"),
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
        meta: { ...FACETED_COLUMN_META, title: "Статус" },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/p/${token}/items/${row.original.id}`}>Заполнить</Link>
          </Button>
        ),
      }
    )

    return base
  }, [token, showSubdivisionColumn])

  return (
    <DataTable
      columns={columns}
      data={rows}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      searchPlaceholder="Поиск по мере, коду, поручению…"
      globalFilterFn={(row, _columnId, filterValue) => {
        const q = String(filterValue).toLowerCase()
        if (!q) return true
        return [
          row.measure.name,
          row.measure.code ?? "",
          row.orderTitle,
          row.subdivisionName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }}
      empty={<p className="py-8 text-center text-sm text-muted-foreground">Меры не найдены</p>}
    />
  )
}
