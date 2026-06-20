"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { usePublicBreadcrumbLabel, usePublicBreadcrumbMiddle } from "@/components/public/public-breadcrumb"
import {
  PublicMeasuresTable,
  type PublicItem,
  type PublicStatus,
} from "@/components/public/public-measures-table"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"

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
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={order.title}
        description={`Выдано ${format(new Date(order.issuedAt), "dd.MM.yyyy")}`}
        backHref={`/p/${token}/orders`}
        backLabel="Поручения"
        actions={<Badge variant="secondary">{items.length} мер</Badge>}
      />

      <PublicMeasuresTable
        token={token}
        items={items}
        statuses={statuses}
        showSubdivisionColumn={showSubdivisionColumn}
        hideOrderColumn
      />
    </div>
  )
}
