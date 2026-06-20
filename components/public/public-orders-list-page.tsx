"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/components/shared/page-header"
import { usePublicBreadcrumbLabel } from "@/components/public/public-breadcrumb"
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowLink,
} from "@/components/data-table"
import { colMeta, actionsColumnMeta } from "@/lib/data-table/column-meta"
import { dateSortFn } from "@/lib/data-table/sort-helpers"
import { format } from "date-fns"

type PublicOrder = {
  id: number
  title: string
  issuedAt: string
  itemCount: number
}

export function PublicOrdersListPage({
  token,
  orders,
}: {
  token: string
  orders: PublicOrder[]
}) {
  usePublicBreadcrumbLabel("Поручения")

  const columns = useMemo<ColumnDef<PublicOrder>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Поручение" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/p/${token}/orders/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
        meta: colMeta("Поручение"),
      },
      {
        accessorKey: "issuedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Выдано" />
        ),
        sortingFn: dateSortFn,
        cell: ({ row }) => format(new Date(row.original.issuedAt), "dd.MM.yyyy"),
        meta: colMeta("Выдано", { valueType: "date" }),
      },
      {
        id: "items",
        accessorFn: (row) => row.itemCount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Мер" />
        ),
        cell: ({ row }) => row.original.itemCount,
        meta: colMeta("Мер"),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <DataTableRowLink href={`/p/${token}/orders/${row.original.id}`} />
        ),
        meta: actionsColumnMeta(),
      },
    ],
    [token]
  )

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Поручения"
        description="Список поручений по исполнению мер"
        backHref={`/p/${token}`}
        backLabel="Сводка"
      />

      <DataTable columns={columns} data={orders} />
    </div>
  )
}
