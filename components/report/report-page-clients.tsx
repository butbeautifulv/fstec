"use client"

import { format } from "date-fns"
import { OrderMeasuresPage } from "@/components/shared/order-measures-page"
import { OrdersListPage } from "@/components/shared/orders-list-page"
import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"
import type { MeasuresTableItem, MeasuresTableStatus } from "@/components/shared/measures-data-table"
import { labels } from "@/lib/ui/branding"

export function ReportOrdersListClient({
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

export function ReportOrderDetailClient({
  token,
  order,
  organizationName,
  items,
  statuses,
  showSubdivisionColumn,
}: {
  token: string
  order: { id: number; title: string; issuedAt: string }
  organizationName: string
  items: MeasuresTableItem[]
  statuses: MeasuresTableStatus[]
  showSubdivisionColumn: boolean
}) {
  return (
    <OrderMeasuresPage
      basePath={`/report/${token}`}
      title={order.title}
      description={`${labels.org}: ${organizationName} · выдано ${format(new Date(order.issuedAt), "dd.MM.yyyy")}`}
      backHref={`/report/${token}`}
      backLabel="Назад к сводке"
      items={items}
      statuses={statuses}
      showSubdivisionColumn={showSubdivisionColumn}
    />
  )
}
