"use client"

import {
  DashboardStatCards as GuiDashboardStatCards,
} from "@cxado/gui/dashboard/dashboard-stat-cards"
import { FSTEC_DASHBOARD_PRESENTATION } from "@/lib/dashboard/presentation-config"
import type { ComponentProps } from "react"

export function DashboardStatCards(
  props: Omit<ComponentProps<typeof GuiDashboardStatCards>, "presentation">
) {
  return (
    <GuiDashboardStatCards presentation={FSTEC_DASHBOARD_PRESENTATION} {...props} />
  )
}
