"use client"

import {
  CompletionBreakdownChartSection as GuiCompletionBreakdownChartSection,
} from "@cxado/gui/dashboard/completion-breakdown-chart-section"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import type { ComponentProps } from "react"

export function CompletionBreakdownChartSection(
  props: Omit<
    ComponentProps<typeof GuiCompletionBreakdownChartSection>,
    "presentation"
  >
) {
  return (
    <GuiCompletionBreakdownChartSection
      presentation={FSTEC_DASHBOARD_PRESENTATION}
      {...props}
    />
  )
}
