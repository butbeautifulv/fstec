import { Suspense } from "react"
import { DashboardPeriodControl } from "@/components/dashboard/dashboard-period-control"
import type { PeriodBounds } from "@/lib/dashboard/period-range"

export const DASHBOARD_PERIOD_LABELS = {
  orders: "Период выдачи поручений:",
  imports: "Период загрузки:",
  reports: "Период отправки отчётов:",
} as const

function PeriodControlFallback({ embedded }: { embedded?: boolean }) {
  if (embedded) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="h-8 w-full max-w-md animate-pulse rounded-md bg-muted/40" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded-md bg-muted/40" />
      </div>
    )
  }

  return <div className="h-24 animate-pulse rounded-lg border bg-muted/40" />
}

export function DashboardPeriodSection({
  bounds,
  embedded = false,
  label = DASHBOARD_PERIOD_LABELS.orders,
}: {
  bounds: PeriodBounds
  embedded?: boolean
  label?: string
}) {
  return (
    <Suspense fallback={<PeriodControlFallback embedded={embedded} />}>
      <DashboardPeriodControl
        minDate={bounds.min}
        maxDate={bounds.max}
        embedded={embedded}
        label={label}
      />
    </Suspense>
  )
}
