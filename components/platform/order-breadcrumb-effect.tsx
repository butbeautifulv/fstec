"use client"

import {
  usePlatformBreadcrumbLabel,
  usePlatformBreadcrumbMiddle,
} from "@/components/platform/platform-breadcrumb"

export function OrderEditBreadcrumbEffect({
  orderId,
  orderTitle,
}: {
  orderId: number
  orderTitle: string
}) {
  usePlatformBreadcrumbMiddle([
    { label: orderTitle, href: `/panel/orders/${orderId}` },
  ])
  usePlatformBreadcrumbLabel("Редактирование")
  return null
}
