"use client"

import type { ColumnFiltersState } from "@tanstack/react-table"
import { TrackedItemsDataTable } from "@/components/shared/tracked-items-data-table"
import { FSTEC_TABLE_LABELS } from "@/lib/ui/table-labels"
import {
  getDisplayStatusName,
  isOrderItemOverdue,
} from "@/lib/statuses/workflow"
import type {
  MeasuresTableItem,
  MeasuresTableStatus,
} from "@/lib/measures/table-types"

export type { MeasuresTableItem, MeasuresTableStatus } from "@/lib/measures/table-types"

export function MeasuresDataTable({
  basePath,
  items,
  statuses,
  showSubdivisionColumn = false,
  showOrderColumn = false,
  subdivisionHref,
  actionLabel,
  columnFilters,
  onColumnFiltersChange,
  pageSize = 50,
}: {
  basePath: string
  items: MeasuresTableItem[]
  statuses: MeasuresTableStatus[]
  showSubdivisionColumn?: boolean
  showOrderColumn?: boolean
  subdivisionHref?: (subdivisionId: number) => string
  actionLabel?: string
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  pageSize?: number
}) {
  return (
    <TrackedItemsDataTable
      basePath={basePath}
      items={items}
      statuses={statuses}
      preset={{
        showSubdivisionColumn,
        showOrderColumn,
        subdivisionHref,
        actionLabel,
      }}
      labels={FSTEC_TABLE_LABELS}
      getDisplayStatusName={getDisplayStatusName}
      isOverdue={isOrderItemOverdue}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      pageSize={pageSize}
    />
  )
}
