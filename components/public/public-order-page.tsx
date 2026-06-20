"use client"

import { useMemo } from "react"
import { usePublicBreadcrumbLabel, usePublicBreadcrumbMiddle } from "@/components/public/public-breadcrumb"
import {
  type PublicItem,
  type PublicStatus,
} from "@/components/public/public-measures-table"
import {
  OrderMeasuresPage,
  formatOrderIssuedDescription,
} from "@/components/shared/order-measures-page"

export function PublicOrderPage({
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

  usePublicBreadcrumbMiddle(middleCrumbs)
  usePublicBreadcrumbLabel(order.title)

  return (
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
  )
}
