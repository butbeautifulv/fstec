"use client"

import { OrdersListPage } from "@/components/shared/orders-list-page"
import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"

export function ReportOrdersListPage({
  token,
  organizationName,
  orders,
}: {
  token: string
  organizationName: string
  orders: OrderListRow[]
}) {
  return (
    <OrdersListPage
      basePath={`/report/${token}`}
      title={organizationName}
      description="Поручения организации"
      backHref={`/report/${token}`}
      backLabel="Назад к сводке"
      orders={orders}
      searchPlaceholder="Поиск по поручению…"
    />
  )
}
