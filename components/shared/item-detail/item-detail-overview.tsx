"use client"

import type { ReactNode } from "react"
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/motion"
import { ItemDetailHeaderActions } from "@/components/shared/item-detail/item-detail-header-actions"
import { ItemDueStatusCard } from "@/components/shared/item-detail/item-due-status-card"
import { ItemMeasureInfoCard } from "@/components/shared/item-detail/item-measure-info-card"
import { PageHeader } from "@/components/shared/page-header"

export function ItemDetailOverview({
  title,
  description,
  backHref,
  backLabel,
  measureCode,
  orderTitle,
  orderHref,
  measureDescription,
  organizationName,
  subdivisionName,
  dueAt,
  displayStatus,
  workflowStatusName,
  reportStatusLabel,
  isOverdue,
  statusVariant,
  dueStatusFooter,
  dueStatusChildren,
  children,
}: {
  title: string
  description: string
  backHref?: string
  backLabel?: string
  measureCode: string | null
  orderTitle: string
  orderHref?: string
  measureDescription: string | null
  organizationName: string
  subdivisionName: string | null
  dueAt: string
  displayStatus: string
  workflowStatusName?: string
  reportStatusLabel?: string | null
  isOverdue: boolean
  statusVariant: "default" | "secondary" | "destructive"
  dueStatusFooter?: ReactNode
  dueStatusChildren?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={title}
        description={description}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          <ItemDetailHeaderActions
            code={measureCode}
            orderTitle={orderTitle}
            orderHref={orderHref}
          />
        }
      />

      <MotionStagger className="grid items-stretch gap-4 lg:grid-cols-2">
        <MotionStaggerItem className="h-full">
          <ItemMeasureInfoCard
            className="h-full"
            description={measureDescription}
            organizationName={organizationName}
            subdivisionName={subdivisionName}
          />
        </MotionStaggerItem>

        <MotionStaggerItem className="h-full">
          <ItemDueStatusCard
            className="h-full"
            dueAt={dueAt}
            displayStatus={displayStatus}
            workflowStatusName={workflowStatusName ?? displayStatus}
            reportStatusLabel={reportStatusLabel}
            isOverdue={isOverdue}
            statusVariant={statusVariant}
            footer={dueStatusFooter}
          >
            {dueStatusChildren}
          </ItemDueStatusCard>
        </MotionStaggerItem>
      </MotionStagger>

      {children ? <MotionFadeIn>{children}</MotionFadeIn> : null}
    </div>
  )
}
