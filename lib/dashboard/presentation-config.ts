import type { LucideIcon } from "lucide-react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  LoaderIcon,
} from "lucide-react"
import {
  DASHBOARD_STATUS_ORDER,
  OVERDUE_LABEL,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"

export type DashboardStatCardMeta = {
  hint: string
  icon: LucideIcon
  badge?: (value: number, total: number) => string | null
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
}

export type DashboardPresentationConfig = {
  statusOrder: readonly string[]
  overdueStackOrder: readonly string[]
  statCardMeta: Record<string, DashboardStatCardMeta>
  chartEmptyLabel: string
  pieColors: readonly string[]
}

function formatPercentBadge(value: number, total: number): string | null {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : null
}

export const FSTEC_DASHBOARD_PRESENTATION: DashboardPresentationConfig = {
  statusOrder: DASHBOARD_STATUS_ORDER,
  overdueStackOrder: [
    OVERDUE_LABEL,
    WORKFLOW_STATUS.IN_PROGRESS,
    WORKFLOW_STATUS.COMPLETED,
  ],
  statCardMeta: {
    [WORKFLOW_STATUS.IN_PROGRESS]: {
      hint: "Активные меры",
      icon: LoaderIcon,
      badge: formatPercentBadge,
      badgeVariant: "outline",
    },
    [WORKFLOW_STATUS.COMPLETED]: {
      hint: "Завершённые меры",
      icon: CheckCircle2Icon,
      badge: formatPercentBadge,
      badgeVariant: "outline",
    },
    [OVERDUE_LABEL]: {
      hint: "Срок прошёл, не завершено",
      icon: AlertTriangleIcon,
      badge: formatPercentBadge,
      badgeVariant: "destructive",
    },
  },
  chartEmptyLabel: "Нет данных",
  pieColors: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"],
}
