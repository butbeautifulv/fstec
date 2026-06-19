import type { FilterFn } from "@tanstack/react-table"

export const FACETED_COLUMN_META = { faceted: true } as const

export const facetedFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const values = filterValue as string[] | undefined
  if (!values?.length) return true
  const cell = row.getValue(columnId)
  if (cell == null || cell === "") return values.includes("—")
  return values.includes(String(cell))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const facetedFilter = facetedFilterFn as FilterFn<any>

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    faceted?: boolean
    title?: string
  }
}
