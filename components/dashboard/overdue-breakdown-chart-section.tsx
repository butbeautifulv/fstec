"use client"

import {
  OverdueBreakdownChartSection as GuiOverdueBreakdownChartSection,
} from "@cxado/gui/dashboard/overdue-breakdown-chart-section"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import type { ComponentProps } from "react"

export function OverdueBreakdownChartSection(
  props: Omit<
    ComponentProps<typeof GuiOverdueBreakdownChartSection>,
    "presentation"
  >
) {
  return (
    <GuiOverdueBreakdownChartSection
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      {...props}
    />
  )
}
