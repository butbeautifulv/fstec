"use client"

import { useMemo } from "react"
import {
  PublicBreadcrumbLabel,
  PublicBreadcrumbMiddle,
} from "@/components/public/public-breadcrumb-effect"
import { OrderMeasuresPage } from "@/components/shared/order-measures-page"
import { OrdersListPage } from "@/components/shared/orders-list-page"
import type { OrderListRow } from "@/lib/data-table/columns/order-list-columns"
import type { MeasuresTableItem, MeasuresTableStatus } from "@/lib/measures/table-types"
import {
  scopedOrderDetailConfig,
  scopedOrderDetailMiddleCrumbs,
  scopedOrdersListConfig,
  type ScopedOrdersContext,
} from "@/lib/nav/scoped-orders-config"

export function ScopedOrdersListClient({
  context,
  orders,
}: {
  context: ScopedOrdersContext
  orders: OrderListRow[]
}) {
  const config = scopedOrdersListConfig(context)

  const content = (
    <OrdersListPage
      basePath={config.basePath}
      title={config.title}
      description={config.description}
      backHref={config.backHref}
      backLabel={config.backLabel}
      orders={orders}
      searchPlaceholder={config.searchPlaceholder}
    />
  )

  if (context.scope === "public") {
    return (
      <>
        <PublicBreadcrumbLabel label="Поручения" />
        {content}
      </>
    )
  }

  return content
}

export function ScopedOrderDetailClient({
  context,
  order,
  items,
  statuses,
  showSubdivisionColumn,
  organizationName,
}: {
  context: ScopedOrdersContext
  order: { id: number; title: string; issuedAt: string }
  items: MeasuresTableItem[]
  statuses: MeasuresTableStatus[]
  showSubdivisionColumn: boolean
  organizationName?: string
}) {
  const config = scopedOrderDetailConfig(context, order, organizationName)
  const middleCrumbs = useMemo(
    () => scopedOrderDetailMiddleCrumbs(context, order),
    [context, order]
  )

  const content = (
    <OrderMeasuresPage
      basePath={config.basePath}
      title={config.title}
      description={config.description}
      backHref={config.backHref}
      backLabel={config.backLabel}
      items={items}
      statuses={statuses}
      showSubdivisionColumn={showSubdivisionColumn}
      subdivisionHref={
        context.scope === "public" && showSubdivisionColumn
          ? (subdivisionId) => `/p/${context.token}/subdivisions/${subdivisionId}`
          : undefined
      }
      actionLabel={config.actionLabel}
    />
  )

  if (context.scope === "public" && middleCrumbs) {
    return (
      <>
        <PublicBreadcrumbMiddle crumbs={middleCrumbs} />
        <PublicBreadcrumbLabel label={order.title} />
        {content}
      </>
    )
  }

  return content
}
