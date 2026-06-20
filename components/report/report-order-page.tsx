"use client"

import { format } from "date-fns"
import { OrderMeasuresPage } from "@/components/shared/order-measures-page"
import { labels } from "@/lib/ui/branding"

type ReportStatus = { id: number; name: string; isTerminal: boolean }

export function ReportOrderPage({
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
  items: {
    id: number
    dueAt: string
    measure: { name: string; code: string | null }
    status: { id: number; name: string; isTerminal?: boolean }
    subdivisionName?: string | null
  }[]
  statuses: ReportStatus[]
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
