"use client"

import { format } from "date-fns"
import type { ReactNode } from "react"
import {
  MeasuresDataTable,
  type MeasuresTableItem,
  type MeasuresTableStatus,
} from "@/components/shared/measures-data-table"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"

export function OrderMeasuresPage({
  basePath,
  title,
  description,
  backHref,
  backLabel,
  items,
  statuses,
  showSubdivisionColumn,
  actionLabel,
}: {
  basePath: string
  title: string
  description: string
  backHref: string
  backLabel: string
  items: MeasuresTableItem[]
  statuses: MeasuresTableStatus[]
  showSubdivisionColumn: boolean
  actionLabel?: string
  headerActions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={title}
        description={description}
        backHref={backHref}
        backLabel={backLabel}
        actions={<Badge variant="secondary">{items.length} мер</Badge>}
      />

      <MeasuresDataTable
        basePath={basePath}
        items={items}
        statuses={statuses}
        showSubdivisionColumn={showSubdivisionColumn}
        actionLabel={actionLabel}
      />
    </div>
  )
}

export function formatOrderIssuedDescription(issuedAt: string): string {
  return `Выдано ${format(new Date(issuedAt), "dd.MM.yyyy")}`
}
