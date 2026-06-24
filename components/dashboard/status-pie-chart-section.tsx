"use client"

import {
  StatusPieChartSection as GuiStatusPieChartSection,
} from "@cxado/gui/dashboard/status-pie-chart-section"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import type { ComponentProps } from "react"

export function StatusPieChartSection(
  props: Omit<ComponentProps<typeof GuiStatusPieChartSection>, "presentation">
) {
  return (
    <GuiStatusPieChartSection
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      {...props}
    />
  )
}
