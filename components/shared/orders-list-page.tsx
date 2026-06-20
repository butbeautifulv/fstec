"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import {
  createOrderListColumns,
  type OrderListRow,
} from "@/lib/data-table/columns/order-list-columns"

export function OrdersListPage({
  basePath,
  title,
  description,
  backHref,
  backLabel,
  orders,
  searchPlaceholder,
}: {
  basePath: string
  title: string
  description: string
  backHref: string
  backLabel: string
  orders: OrderListRow[]
  searchPlaceholder?: string
}) {
  const columns = useMemo(
    () => createOrderListColumns((row) => `${basePath}/orders/${row.id}`),
    [basePath]
  )

  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-6">
      <PageHeader
        title={title}
        description={description}
        backHref={backHref}
        backLabel={backLabel}
      />

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder={searchPlaceholder}
        globalFilterFn={
          searchPlaceholder
            ? (row, _columnId, filterValue) => {
                const q = String(filterValue).toLowerCase()
                if (!q) return true
                return row.title.toLowerCase().includes(q)
              }
            : undefined
        }
        empty={
          searchPlaceholder ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Поручения не найдены
            </p>
          ) : undefined
        }
      />
    </div>
  )
}
