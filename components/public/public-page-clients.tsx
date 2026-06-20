"use client"

import { useMemo } from "react"
import { PublicBreadcrumbLabel, PublicBreadcrumbMiddle } from "@/components/public/public-breadcrumb-effect"
import { OrderMeasuresPage, formatOrderIssuedDescription } from "@/components/shared/order-measures-page"
import { OrdersListPage } from "@/components/shared/orders-list-page"
import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"
import type { PublicItem, PublicStatus } from "@/lib/public/types"

export function PublicOrdersListClient({
  token,
  orders,
}: {
  token: string
  orders: OrderListRow[]
}) {
  return (
    <>
      <PublicBreadcrumbLabel label="Поручения" />
      <OrdersListPage
        basePath={`/p/${token}`}
        title="Поручения"
        description="Список поручений по исполнению мер"
        backHref={`/p/${token}`}
        backLabel="Сводка"
        orders={orders}
      />
    </>
  )
}

export function PublicOrderDetailClient({
  token,
  order,
  items,
  statuses,
  showSubdivisionColumn,
}: {
  token: string
  order: { id: number; title: string; issuedAt: string }
  items: PublicItem[]
  statuses: PublicStatus[]
  showSubdivisionColumn: boolean
}) {
  const middleCrumbs = useMemo(
    () => [
      { label: "Сводка", href: `/p/${token}` },
      { label: "Поручения", href: `/p/${token}/orders` },
    ],
    [token]
  )

  return (
    <>
      <PublicBreadcrumbMiddle crumbs={middleCrumbs} />
      <PublicBreadcrumbLabel label={order.title} />
      <OrderMeasuresPage
        basePath={`/p/${token}`}
        title={order.title}
        description={formatOrderIssuedDescription(order.issuedAt)}
        backHref={`/p/${token}/orders`}
        backLabel="Поручения"
        items={items}
        statuses={statuses}
        showSubdivisionColumn={showSubdivisionColumn}
        actionLabel="Заполнить"
      />
    </>
  )
}
