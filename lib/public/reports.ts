import "server-only"

import { cache } from "react"
import { ResponseReviewStatus } from "@prisma/client"
import { prismaRead } from "@/lib/db"
import {
  boundsFromIsoDates,
  filterRowsByPeriod,
} from "@/lib/dashboard/period-filter-rows"
import type { PeriodRange } from "@/lib/dashboard/period-range"
import { isCompleted } from "@/lib/statuses/workflow"
import { publicItemScopeWhere, validateAccessLink } from "@/lib/public/validate-token"

export type PublicReportStatusFilter = ResponseReviewStatus | undefined

export type PublicReportRow = {
  orderItemId: number
  measure: { id: number; name: string; code: string | null }
  order: { id: number; title: string }
  submittedAt: string | null
  reviewStatus: ResponseReviewStatus | null
  reviewNote: string | null
  needsRevision: boolean
  isCompleted: boolean
}

type ScopedReportItem = {
  id: number
  status: { id: number; name: string; isTerminal: boolean }
  measure: { id: number; name: string; code: string | null }
  order: { id: number; title: string }
  responses: {
    reviewStatus: ResponseReviewStatus
    reviewNote: string | null
    submittedAt: Date
  }[]
}

function toPublicReportRow(item: ScopedReportItem): PublicReportRow | null {
  const latest = item.responses[0]
  if (!latest) return null

  const completed = isCompleted(item.status)
  const needsRevision =
    latest.reviewStatus === ResponseReviewStatus.REJECTED && !completed

  return {
    orderItemId: item.id,
    measure: item.measure,
    order: item.order,
    submittedAt: latest.submittedAt.toISOString(),
    reviewStatus: latest.reviewStatus,
    reviewNote: latest.reviewNote,
    needsRevision,
    isCompleted: completed,
  }
}

function matchesReportFilter(
  row: PublicReportRow,
  filter?: PublicReportStatusFilter
): boolean {
  if (!filter) return true

  if (filter === ResponseReviewStatus.PENDING) {
    return row.reviewStatus === ResponseReviewStatus.PENDING
  }

  if (filter === ResponseReviewStatus.REJECTED) {
    return row.needsRevision
  }

  if (filter === ResponseReviewStatus.ACCEPTED) {
    return (
      row.reviewStatus === ResponseReviewStatus.ACCEPTED || row.isCompleted
    )
  }

  return true
}

const fetchAllPublicReportRows = cache(async (token: string) => {
  const ctx = await validateAccessLink(token)
  if (!ctx) return null

  const items = await prismaRead.orderItem.findMany({
    where: {
      ...publicItemScopeWhere(ctx.link),
      responses: { some: {} },
    },
    select: {
      id: true,
      status: { select: { id: true, name: true, isTerminal: true } },
      measure: { select: { id: true, name: true, code: true } },
      order: { select: { id: true, title: true } },
      responses: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          reviewStatus: true,
          reviewNote: true,
          submittedAt: true,
        },
      },
    },
    orderBy: [{ order: { issuedAt: "desc" } }, { measure: { name: "asc" } }],
  })

  const rows = items
    .map(toPublicReportRow)
    .filter((row): row is PublicReportRow => row != null)

  return { ctx, rows }
})

export const fetchPublicReportItems = cache(
  async (
    token: string,
    statusFilter?: PublicReportStatusFilter,
    period?: PeriodRange
  ) => {
    const result = await fetchAllPublicReportRows(token)
    if (!result) return null

    let rows = result.rows.filter((row) => matchesReportFilter(row, statusFilter))
    if (period) {
      rows = filterRowsByPeriod(rows, period, "submittedAt")
    }

    return {
      organization: result.ctx.organization,
      subdivision: result.ctx.subdivision,
      rows,
    }
  }
)

export async function getPublicReportPeriodBounds(token: string) {
  const result = await fetchAllPublicReportRows(token)
  if (!result) return null
  return boundsFromIsoDates(result.rows.map((row) => row.submittedAt))
}

export const countPublicReportsNeedingRevision = cache(async (token: string) => {
  const result = await fetchAllPublicReportRows(token)
  if (!result) return 0
  return result.rows.filter((row) => row.needsRevision).length
})

export const countPublicReportItems = cache(
  async (token: string, statusFilter?: PublicReportStatusFilter) => {
    const result = await fetchAllPublicReportRows(token)
    if (!result) return 0
    return result.rows.filter((row) => matchesReportFilter(row, statusFilter)).length
  }
)
