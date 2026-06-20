import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader, DataTableRowLink } from "@/components/data-table"
import { actionsColumnMeta, colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { TextCell } from "@/lib/data-table/text-cell"
import { format } from "date-fns"

export type OrderListRow = {
  id: number
  title: string
  issuedAt: string
  itemCount: number
}

export function createOrderListColumns(
  orderHref: (row: OrderListRow) => string
): ColumnDef<OrderListRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Поручение" />
      ),
      cell: ({ row }) => (
        <TextCell text={row.original.title} href={orderHref(row.original)} />
      ),
      meta: textColumnMeta("Поручение", "w-[50%]"),
    },
    {
      accessorKey: "issuedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Выдано" />
      ),
      sortingFn: dateSortFn,
      cell: ({ row }) => format(new Date(row.original.issuedAt), "dd.MM.yyyy"),
      meta: colMeta("Выдано", { valueType: "date", cellClassName: "w-28" }),
    },
    {
      id: "items",
      accessorFn: (row) => row.itemCount,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Мер" />
      ),
      cell: ({ row }) => row.original.itemCount,
      meta: colMeta("Мер", { cellClassName: "w-20" }),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      cell: ({ row }) => <DataTableRowLink href={orderHref(row.original)} />,
      meta: actionsColumnMeta(),
    },
  ]
}
