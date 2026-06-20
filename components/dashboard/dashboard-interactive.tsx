"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards"
import { ScopedDashboardView } from "@/components/dashboard/scoped-dashboard-view"
import {
  buildDashboardHref,
  matrixQueryToColumnFilters,
  toggleMatrixStatusFilter,
} from "@/lib/dashboard/dashboard-query"
import type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"

export type { DashboardInteractiveProps } from "@/lib/dashboard/interactive-props"
export type { DashboardVariant } from "@/lib/dashboard/variant-config"

function activeStatusFromQuery(
  matrixQuery: DashboardInteractiveProps["matrixQuery"]
): string | undefined {
  if (matrixQuery.displayStatuses?.length === 1) {
    return matrixQuery.displayStatuses[0]
  }
  return undefined
}

export function DashboardInteractive({
  showStatCards = true,
  ...props
}: DashboardInteractiveProps & { showStatCards?: boolean }) {
  const router = useRouter()
  const { stats, baseHref, matrixQuery } = props
  const chartScope = props.scope

  const columnFilters = useMemo(
    () => matrixQueryToColumnFilters(chartScope, matrixQuery),
    [chartScope, matrixQuery]
  )

  const activeStatus = activeStatusFromQuery(matrixQuery)

  return (
    <>
      {showStatCards ? (
        <DashboardStatCards
          stats={stats}
          activeStatus={activeStatus}
          onStatusClick={(status) =>
            router.push(
              buildDashboardHref(
                baseHref,
                toggleMatrixStatusFilter(matrixQuery, status)
              )
            )
          }
        />
      ) : null}
      <ScopedDashboardView {...props} columnFilters={columnFilters} />
    </>
  )
}
