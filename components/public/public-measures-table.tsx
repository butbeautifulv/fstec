"use client"

import type { ColumnFiltersState } from "@tanstack/react-table"
import {
  MeasuresDataTable,
  type MeasuresTableItem,
  type MeasuresTableStatus,
} from "@/components/shared/measures-data-table"

export type PublicStatus = MeasuresTableStatus

export type PublicItem = MeasuresTableItem & {
  orderId: number
  orderTitle: string
  orderIssuedAt: string
}

export function PublicMeasuresTable({
  token,
  items,
  statuses,
  showSubdivisionColumn = false,
  hideOrderColumn = false,
  columnFilters,
  onColumnFiltersChange,
}: {
  token: string
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn?: boolean
  hideOrderColumn?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}) {
  return (
    <MeasuresDataTable
      basePath={`/p/${token}`}
      items={items}
      statuses={statuses}
      showSubdivisionColumn={showSubdivisionColumn}
      showOrderColumn={!hideOrderColumn}
      actionLabel="Заполнить"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    />
  )
}
