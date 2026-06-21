import type { ReactNode } from "react"
import { DataTableShell } from "@/components/platform/data-table-shell"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type StaticCrudTableColumn<T> = {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export function StaticCrudTable<T>({
  columns,
  rows,
  emptyMessage,
  actions,
  getRowKey,
}: {
  columns: StaticCrudTableColumn<T>[]
  rows: T[]
  emptyMessage: string
  actions?: (row: T) => ReactNode
  getRowKey?: (row: T, index: number) => string | number
}) {
  return (
    <DataTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions ? <TableHead className="w-16" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={getRowKey?.(row, index) ?? index}>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
                {actions ? <TableCell>{actions(row)}</TableCell> : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </DataTableShell>
  )
}
