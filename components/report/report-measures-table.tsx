"use client"

import {
  MeasuresDataTable,
  type MeasuresTableItem,
  type MeasuresTableStatus,
} from "@/components/shared/measures-data-table"

export type ReportMeasureItem = MeasuresTableItem

export type ReportStatus = MeasuresTableStatus

export function ReportMeasuresTable({
  token,
  items,
  statuses,
  showSubdivisionColumn = false,
}: {
  token: string
  items: ReportMeasureItem[]
  statuses: ReportStatus[]
  showSubdivisionColumn?: boolean
}) {
  return (
    <MeasuresDataTable
      basePath={`/report/${token}`}
      items={items}
      statuses={statuses}
      showSubdivisionColumn={showSubdivisionColumn}
    />
  )
}
