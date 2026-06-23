"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ScopedDashboardStats } from "@/lib/dashboard/stats"
import { MotionStagger, MotionStaggerItem } from "@/components/motion"
import { cn } from "@/lib/utils"
import {
  OVERDUE_LABEL,
  DASHBOARD_STATUS_ORDER,
  WORKFLOW_STATUS,
} from "@/lib/statuses/workflow"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  LoaderIcon,
  type LucideIcon,
} from "lucide-react"

function countForStatus(
  distribution: ScopedDashboardStats["statusDistribution"],
  status: string
) {
  return distribution.find((row) => row.status === status)?.count ?? 0
}

function formatPercentBadge(value: number, total: number): string | null {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : null
}

type CardMeta = {
  hint: string
  icon: LucideIcon
  badge?: (value: number, total: number) => string | null
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
}

const CARD_META: Record<(typeof DASHBOARD_STATUS_ORDER)[number], CardMeta> = {
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
}

export function DashboardStatCards({
  stats,
  activeStatus,
  onStatusClick,
}: {
  stats: ScopedDashboardStats
  activeStatus?: string
  onStatusClick?: (status: string) => void
}) {
  const total = stats.statusDistribution.reduce((sum, row) => sum + row.count, 0)

  const cards = DASHBOARD_STATUS_ORDER.map((status) => {
    const value = countForStatus(stats.statusDistribution, status)
    const meta = CARD_META[status]
    const Icon = meta.icon
    const badge = meta.badge?.(value, total) ?? null

    return { status, value, hint: meta.hint, Icon, badge, badgeVariant: meta.badgeVariant }
  })

  return (
    <MotionStagger className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @4xl/main:grid-cols-3">
      {cards.map((card) => {
        const interactive = Boolean(onStatusClick)
        const isActive = interactive && activeStatus === card.status

        const cardBody = (
          <>
            <CardHeader>
              <CardDescription>{card.status}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              {card.badge && (
                <CardAction>
                  <Badge variant={card.badgeVariant ?? "outline"}>{card.badge}</Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex gap-2 font-medium">
                <card.Icon className="size-4 text-muted-foreground" />
                {card.hint}
              </div>
            </CardFooter>
          </>
        )

        return (
          <MotionStaggerItem key={card.status}>
            <Card
              className={cn(
                "@container/card shadow-xs transition-colors",
                interactive && "hover:ring-2 hover:ring-ring/40",
                isActive && "ring-2 ring-primary"
              )}
            >
              {interactive ? (
                <button
                  type="button"
                  className="w-full text-left"
                  aria-pressed={isActive}
                  onClick={() => onStatusClick?.(card.status)}
                >
                  {cardBody}
                </button>
              ) : (
                cardBody
              )}
            </Card>
          </MotionStaggerItem>
        )
      })}
    </MotionStagger>
  )
}
