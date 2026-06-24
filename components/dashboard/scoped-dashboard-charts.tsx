"use client"

import {
  ScopedDashboardCharts as GuiScopedDashboardCharts,
} from "@cxado/gui/dashboard/scoped-dashboard-charts"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import type { ComponentProps } from "react"

export function ScopedDashboardCharts(
  props: Omit<ComponentProps<typeof GuiScopedDashboardCharts>, "presentation">
) {
  return (
    <GuiScopedDashboardCharts
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      {...props}
    />
  )
}
