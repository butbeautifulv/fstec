"use client"

import { usePublicBreadcrumbLabel } from "@/components/public/public-breadcrumb"
import { OrdersListPage } from "@/components/shared/orders-list-page"
import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"

export function PublicOrdersListPage({
  token,
  orders,
}: {
  token: string
  orders: OrderListRow[]
}) {
  usePublicBreadcrumbLabel("Поручения")

  return (
    <OrdersListPage
      basePath={`/p/${token}`}
      title="Поручения"
      description="Список поручений по исполнению мер"
      backHref={`/p/${token}`}
      backLabel="Сводка"
      orders={orders}
    />
  )
}
