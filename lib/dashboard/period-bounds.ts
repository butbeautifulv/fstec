import "server-only"

import { prismaRead } from "@/lib/db"
import {
  expandSingleDayBounds,
  formatDateIso,
  type PeriodBounds,
} from "@/lib/dashboard/period-range"

export type { PeriodBounds } from "@/lib/dashboard/period-range"

export async function getOrderIssuedAtBounds(): Promise<PeriodBounds> {
  const [minRow, maxRow] = await Promise.all([
    prismaRead.order.findFirst({
      orderBy: { issuedAt: "asc" },
      select: { issuedAt: true },
    }),
    prismaRead.order.findFirst({
      orderBy: { issuedAt: "desc" },
      select: { issuedAt: true },
    }),
  ])

  const today = formatDateIso(new Date())
  const min = minRow?.issuedAt
    ? formatDateIso(minRow.issuedAt)
    : formatDateIso(new Date(Date.now() - 365 * 86_400_000))
  const max = maxRow?.issuedAt
    ? formatDateIso(maxRow.issuedAt > new Date() ? new Date() : maxRow.issuedAt)
    : today

  const cappedMax = max > today ? today : max
  const bounds = minRow?.issuedAt
    ? expandSingleDayBounds({ min, max: cappedMax })
    : { min, max: cappedMax }

  return bounds
}
