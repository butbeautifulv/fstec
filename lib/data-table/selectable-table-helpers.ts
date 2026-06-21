import type { Table } from "@tanstack/react-table"

export function selectAllFiltered<T>(
  table: Table<T>,
  getKey: (row: T) => string | number,
  selectedKeys: Set<string | number>,
  onSelectionChange: (next: Set<string | number>) => void
) {
  const next = new Set(selectedKeys)
  for (const row of table.getFilteredRowModel().rows) {
    next.add(getKey(row.original))
  }
  onSelectionChange(next)
}

export function toggleInSet<T extends string | number>(
  set: Set<T>,
  key: T
): Set<T> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}
