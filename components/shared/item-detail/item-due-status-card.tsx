"use client"

import type { ReactNode } from "react"
import { MotionStatusBadge } from "@/components/motion"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export function ItemDueStatusCard({
  dueAt,
  displayStatus,
  workflowStatusName,
  reportStatusLabel,
  isOverdue,
  statusVariant,
  footer,
  children,
  className,
}: {
  dueAt: string
  displayStatus: string
  workflowStatusName?: string
  reportStatusLabel?: string | null
  isOverdue: boolean
  statusVariant: "default" | "secondary" | "destructive"
  footer?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const workflowLabel = workflowStatusName ?? displayStatus
  const statusKey = reportStatusLabel
    ? `${workflowLabel}:${reportStatusLabel}`
    : workflowLabel

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden",
        isOverdue && "border-destructive/40",
        className
      )}
    >
      {isOverdue ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-destructive/5"
        />
      ) : null}
      <CardHeader className="relative">
        <CardTitle className="text-base">Срок и статус</CardTitle>
        <CardDescription>Текущее состояние исполнения</CardDescription>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-3xl font-medium tabular-nums">
            {format(new Date(dueAt), "dd.MM.yyyy")}
          </span>
          <MotionStatusBadge statusKey={statusKey}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant={statusVariant}>{workflowLabel}</Badge>
              {reportStatusLabel ? (
                <Badge variant="destructive">{reportStatusLabel}</Badge>
              ) : null}
            </div>
          </MotionStatusBadge>
        </div>
        {children}
      </CardContent>
      {footer ? <CardFooter className="relative">{footer}</CardFooter> : null}
    </Card>
  )
}
